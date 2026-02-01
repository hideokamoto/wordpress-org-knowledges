#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import https from "https";
import TurndownService from "turndown";

// --- Constants ---

const HANDBOOK_SUBTYPES = [
  "plugin-handbook",
  "theme-handbook",
  "blocks-handbook",
  "rest-api-handbook",
  "apis-handbook",
  "wpcs-handbook",
  "adv-admin-handbook",
];

const CODE_REF_SUBTYPES = [
  "wp-parser-function",
  "wp-parser-hook",
  "wp-parser-class",
  "wp-parser-method",
];

const VALID_SUBTYPES = [...HANDBOOK_SUBTYPES, ...CODE_REF_SUBTYPES];

// --- Interfaces ---

interface SearchResultItem {
  id: number;
  title: string;
  url: string;
  type: string;
}

interface HandbookDocument {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  link: string;
  excerpt: { rendered: string };
}

interface CodeReferenceDocument {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  "wp-parser-since": string[];
  "wp-parser-source-file": string[];
}

interface ApiErrorResponse {
  code: string;
  message: string;
}

// --- HTTP Layer ---

interface HttpResponse {
  statusCode: number;
  body: string;
}

function httpGet(url: string): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk: string) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({ statusCode: res.statusCode || 0, body: data });
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error(`Request timed out: ${url}`));
    });

    req.on("error", (err: Error) => {
      reject(new Error(`Request failed for ${url}: ${err.message}`));
    });
  });
}

async function httpGetJson<T>(
  url: string
): Promise<{ statusCode: number; data: T }> {
  const response = await httpGet(url);
  try {
    return {
      statusCode: response.statusCode,
      data: JSON.parse(response.body) as T,
    };
  } catch {
    throw new Error(
      `Failed to parse JSON response from ${url}: ${response.body.substring(0, 200)}`
    );
  }
}

// --- Search Tool ---

async function searchWordPressDocs(params: {
  query: string;
  subtypes?: string[];
  per_page?: number;
}): Promise<string> {
  const { query, subtypes, per_page = 10 } = params;

  if (subtypes && subtypes.length > 0) {
    const invalid = subtypes.filter((s) => !VALID_SUBTYPES.includes(s));
    if (invalid.length > 0) {
      return `Invalid subtypes: ${invalid.join(", ")}. Valid subtypes are: ${VALID_SUBTYPES.join(", ")}`;
    }
  }

  const searchParams = new URLSearchParams({
    search: query,
    per_page: String(per_page),
    _fields: "id,title,link,type",
  });

  if (subtypes && subtypes.length > 0) {
    searchParams.set("subtype", subtypes.join(","));
  }

  const url = `https://developer.wordpress.org/wp-json/wp/v2/search?${searchParams.toString()}`;

  let result: { statusCode: number; data: unknown };
  try {
    result = await httpGetJson<unknown>(url);
  } catch (err: unknown) {
    return `Error fetching search results: ${(err as Error).message}`;
  }

  const response = result.data;

  if (Array.isArray(response)) {
    if (response.length === 0) {
      return "No results found for the given query.";
    }

    const results: SearchResultItem[] = response.map((item: unknown) => {
      const entry = item as Record<string, unknown>;
      const title =
        typeof entry.title === "object" && entry.title !== null
          ? (entry.title as { rendered?: string }).rendered || ""
          : String(entry.title || "");
      return {
        id: Number(entry.id),
        title,
        url: String(entry.link || ""),
        type: String(entry.type || ""),
      };
    });

    return JSON.stringify(results, null, 2);
  }

  // Non-array error response
  const errorResponse = response as ApiErrorResponse;
  if (errorResponse.code && errorResponse.message) {
    return `WordPress API error [${errorResponse.code}]: ${errorResponse.message} (URL: ${url})`;
  }

  return `Unexpected response format from ${url}: ${JSON.stringify(response)}`;
}

// --- Content Retrieval Tool ---

async function getWordPressDocContent(params: {
  id: number;
  subtype: string;
}): Promise<string> {
  const { id, subtype } = params;
  const turndownService = new TurndownService();

  if (!VALID_SUBTYPES.includes(subtype)) {
    return `Invalid subtype: ${subtype}. Valid subtypes are: ${VALID_SUBTYPES.join(", ")}`;
  }

  if (HANDBOOK_SUBTYPES.includes(subtype)) {
    const url = `https://developer.wordpress.org/wp-json/wp/v2/${subtype}/${id}?_fields=id,title,content,link,excerpt`;

    let result: {
      statusCode: number;
      data: HandbookDocument | ApiErrorResponse;
    };
    try {
      result = await httpGetJson<HandbookDocument | ApiErrorResponse>(url);
    } catch (err: unknown) {
      return `Error fetching document: ${(err as Error).message}`;
    }

    if (result.statusCode === 404) {
      return `Document not found: ${subtype} with id ${id}`;
    }

    const errorDoc = result.data as ApiErrorResponse;
    if (errorDoc.code === "rest_invalid_param") {
      return `Invalid parameter error: ${errorDoc.message} (URL: ${url})`;
    }

    const doc = result.data as HandbookDocument;
    const content = turndownService.turndown(doc.content?.rendered || "");

    return JSON.stringify(
      {
        id: doc.id,
        title: doc.title?.rendered || "",
        url: doc.link || "",
        content,
      },
      null,
      2
    );
  }

  // Code reference subtypes
  const url = `https://developer.wordpress.org/wp-json/wp/v2/${subtype}/${id}?_fields=id,title,excerpt,link,wp-parser-since,wp-parser-source-file`;

  let result: {
    statusCode: number;
    data: CodeReferenceDocument | ApiErrorResponse;
  };
  try {
    result = await httpGetJson<CodeReferenceDocument | ApiErrorResponse>(url);
  } catch (err: unknown) {
    return `Error fetching document: ${(err as Error).message}`;
  }

  if (result.statusCode === 404) {
    return `Document not found: ${subtype} with id ${id}`;
  }

  const errorDoc = result.data as ApiErrorResponse;
  if (errorDoc.code === "rest_invalid_param") {
    return `Invalid parameter error: ${errorDoc.message} (URL: ${url})`;
  }

  const doc = result.data as CodeReferenceDocument;
  const excerpt = turndownService.turndown(doc.excerpt?.rendered || "");
  const since = Array.isArray(doc["wp-parser-since"])
    ? doc["wp-parser-since"].join(", ")
    : "";
  const sourceFile = Array.isArray(doc["wp-parser-source-file"])
    ? doc["wp-parser-source-file"].join(", ")
    : "";

  return JSON.stringify(
    {
      id: doc.id,
      title: doc.title?.rendered || "",
      url: doc.link || "",
      excerpt,
      since,
      source_file: sourceFile,
    },
    null,
    2
  );
}

// --- MCP Server Setup ---

const server = new Server(
  {
    name: "mcp-wordpress-docs",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_wordpress_docs",
        description:
          "Search WordPress developer documentation for topics, functions, hooks, classes, and handbook entries.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query string",
            },
            subtypes: {
              type: "array",
              items: { type: "string" },
              description: `Optional filter for documentation subtypes. Valid values: ${VALID_SUBTYPES.join(", ")}`,
            },
            per_page: {
              type: "number",
              description: "Number of results to return (default: 10)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_wordpress_doc_content",
        description:
          "Retrieve the full content of a WordPress documentation entry by its ID and subtype. Handbook entries return full content; code references return excerpt only.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "The document ID",
            },
            subtype: {
              type: "string",
              description: `The document subtype. Valid values: ${VALID_SUBTYPES.join(", ")}`,
            },
          },
          required: ["id", "subtype"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, input } = request.params;

  if (name === "search_wordpress_docs") {
    const result = await searchWordPressDocs(
      input as { query: string; subtypes?: string[]; per_page?: number }
    );
    return {
      content: [{ type: "text", text: result }],
    };
  }

  if (name === "get_wordpress_doc_content") {
    const result = await getWordPressDocContent(
      input as { id: number; subtype: string }
    );
    return {
      content: [{ type: "text", text: result }],
    };
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

// Connect via StdioServerTransport
const transport = new StdioServerTransport();
server.connect(transport);
