#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import * as https from "https";
import TurndownService from "turndown";

// Constants
const API_BASE_URL = "https://developer.wordpress.org/wp-json/wp/v2";
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Valid subtypes for validation
const HANDBOOK_SUBTYPES = [
  "plugin-handbook",
  "theme-handbook",
  "blocks-handbook",
  "rest-api-handbook",
  "apis-handbook",
  "wpcs-handbook",
  "adv-admin-handbook",
] as const;

const CODE_REF_SUBTYPES = [
  "wp-parser-function",
  "wp-parser-hook",
  "wp-parser-class",
  "wp-parser-method",
] as const;

const VALID_SUBTYPES = [...HANDBOOK_SUBTYPES, ...CODE_REF_SUBTYPES];

type HandbookSubtype = (typeof HANDBOOK_SUBTYPES)[number];
type CodeRefSubtype = (typeof CODE_REF_SUBTYPES)[number];
type ValidSubtype = (typeof VALID_SUBTYPES)[number];

// Turndown instance for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

// HTTP request helper
function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: REQUEST_TIMEOUT }, (response) => {
      if (response.statusCode === 404) {
        response.resume(); // Consume response to free up socket
        reject(new Error(`Document not found (404): ${url}`));
        return;
      }

      if (response.statusCode && response.statusCode >= 400) {
        response.resume(); // Consume response to free up socket
        reject(new Error(`HTTP error ${response.statusCode}: ${url}`));
        return;
      }

      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        resolve(data);
      });
    });

    request.on("error", (error) => {
      reject(new Error(`Network error: ${error.message} (${url})`));
    });

    request.on("timeout", () => {
      request.destroy();
      reject(new Error(`Request timeout after ${REQUEST_TIMEOUT}ms: ${url}`));
    });
  });
}

// Validation helpers
function isValidSubtype(subtype: string): subtype is ValidSubtype {
  return VALID_SUBTYPES.includes(subtype as ValidSubtype);
}

function isHandbookSubtype(subtype: string): subtype is HandbookSubtype {
  return HANDBOOK_SUBTYPES.includes(subtype as HandbookSubtype);
}

function isCodeRefSubtype(subtype: string): subtype is CodeRefSubtype {
  return CODE_REF_SUBTYPES.includes(subtype as CodeRefSubtype);
}

// Search result interface
interface SearchResult {
  id: number;
  title: string;
  url: string;
  subtype: string;
}

interface SearchApiResponse {
  id: number;
  title: string;
  url: string;
  subtype: string;
}

// Tool: search_wordpress_docs
async function searchWordPressDocs(
  query: string,
  subtypes?: string[],
  perPage: number = 5
): Promise<SearchResult[]> {
  // Validate subtypes if provided
  if (subtypes && subtypes.length > 0) {
    const invalidSubtypes = subtypes.filter((s) => !isValidSubtype(s));
    if (invalidSubtypes.length > 0) {
      throw new Error(
        `Invalid subtypes: ${invalidSubtypes.join(", ")}. Valid subtypes are: ${VALID_SUBTYPES.join(", ")}`
      );
    }
  }

  // Validate perPage
  if (perPage < 1 || perPage > 100) {
    throw new Error("per_page must be between 1 and 100");
  }

  // Build URL
  const params = new URLSearchParams({
    search: query,
    per_page: perPage.toString(),
    _fields: "id,title,url,subtype",
  });

  if (subtypes && subtypes.length > 0) {
    params.set("subtype", subtypes.join(","));
  }

  const url = `${API_BASE_URL}/search?${params.toString()}`;

  try {
    const responseText = await httpsGet(url);
    const response = JSON.parse(responseText);

    // Check if response is an error object
    if (!Array.isArray(response)) {
      if (response.code && response.message) {
        throw new Error(`API error: ${response.message}`);
      }
      throw new Error("Unexpected API response format");
    }

    // Map results
    return response.map((item: SearchApiResponse) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      subtype: item.subtype,
    }));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse API response: ${error.message}`);
    }
    throw error;
  }
}

// Handbook content response interface
interface HandbookContent {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  link: string;
}

// Code reference response interface
interface CodeRefContent {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  "wp-parser-since"?: string[];
  "wp-parser-source-file"?: string[];
}

// Tool: get_wordpress_doc_content
async function getWordPressDocContent(
  subtype: string,
  id: number
): Promise<object> {
  // Validate subtype
  if (!isValidSubtype(subtype)) {
    throw new Error(
      `Invalid subtype: ${subtype}. Valid subtypes are: ${VALID_SUBTYPES.join(", ")}`
    );
  }

  // Validate id
  if (!Number.isInteger(id) || id < 1) {
    throw new Error("id must be a positive integer");
  }

  if (isHandbookSubtype(subtype)) {
    // Handbook content fetch
    const url = `${API_BASE_URL}/${subtype}/${id}?_fields=id,title,content,link,excerpt`;

    try {
      const responseText = await httpsGet(url);
      const response: HandbookContent = JSON.parse(responseText);

      // Check for error response
      if ((response as unknown as { code?: string; message?: string }).code) {
        const errorResponse = response as unknown as {
          code: string;
          message: string;
        };
        throw new Error(`API error: ${errorResponse.message}`);
      }

      // Convert HTML content to Markdown
      const markdownContent = turndownService.turndown(
        response.content.rendered
      );

      return {
        id: response.id,
        title: response.title.rendered,
        url: response.link,
        content: markdownContent,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse API response: ${error.message}`);
      }
      throw error;
    }
  } else if (isCodeRefSubtype(subtype)) {
    // Code reference content fetch
    const url = `${API_BASE_URL}/${subtype}/${id}?_fields=id,title,excerpt,link,wp-parser-since,wp-parser-source-file`;

    try {
      const responseText = await httpsGet(url);
      const response: CodeRefContent = JSON.parse(responseText);

      // Check for error response
      if ((response as unknown as { code?: string; message?: string }).code) {
        const errorResponse = response as unknown as {
          code: string;
          message: string;
        };
        throw new Error(`API error: ${errorResponse.message}`);
      }

      // Convert HTML excerpt to Markdown
      const markdownExcerpt = turndownService.turndown(
        response.excerpt.rendered
      );

      return {
        id: response.id,
        title: response.title.rendered,
        url: response.link,
        excerpt: markdownExcerpt,
        since: response["wp-parser-since"]?.[0] || null,
        source_file: response["wp-parser-source-file"]?.[0] || null,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse API response: ${error.message}`);
      }
      throw error;
    }
  }

  throw new Error(`Unhandled subtype: ${subtype}`);
}

// Create MCP server
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

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_wordpress_docs",
        description:
          "Search WordPress developer documentation including handbooks (Plugin, Theme, Block Editor, REST API, Common APIs, Coding Standards, Advanced Administration) and code references (functions, hooks, classes, methods). Returns a list of matching documents with IDs, titles, URLs, and types. Use this to find relevant documentation before retrieving full content.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search keywords (e.g., 'register_post_type', 'custom post type', 'add_action')",
            },
            subtypes: {
              type: "array",
              items: {
                type: "string",
                enum: VALID_SUBTYPES,
              },
              description:
                "Filter by document types. Handbooks: plugin-handbook, theme-handbook, blocks-handbook, rest-api-handbook, apis-handbook, wpcs-handbook, adv-admin-handbook. Code references: wp-parser-function, wp-parser-hook, wp-parser-class, wp-parser-method. If omitted, searches all types.",
            },
            per_page: {
              type: "number",
              description: "Number of results to return (1-100, default: 5)",
              minimum: 1,
              maximum: 100,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_wordpress_doc_content",
        description:
          "Retrieve the full content of a specific WordPress documentation page. For handbooks, returns the complete content in Markdown format. For code references (functions, hooks, classes, methods), returns the excerpt/description along with metadata like 'since' version and source file location. Use the ID and subtype from search_wordpress_docs results.",
        inputSchema: {
          type: "object",
          properties: {
            subtype: {
              type: "string",
              enum: VALID_SUBTYPES,
              description: "The document type (from search results)",
            },
            id: {
              type: "number",
              description: "The document ID (from search results)",
            },
          },
          required: ["subtype", "id"],
        },
      },
    ],
  };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "search_wordpress_docs") {
      const query = args?.query as string;

      if (!query || typeof query !== "string") {
        throw new McpError(ErrorCode.InvalidParams, "query is required and must be a string");
      }

      // Validate subtypes
      const rawSubtypes = args?.subtypes;
      let subtypes: string[] | undefined;
      if (rawSubtypes !== undefined) {
        if (!Array.isArray(rawSubtypes)) {
          throw new McpError(ErrorCode.InvalidParams, "subtypes must be an array");
        }
        // Validate each subtype value
        const invalidSubtypes = rawSubtypes.filter((s) => !isValidSubtype(s));
        if (invalidSubtypes.length > 0) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `subtypes contain invalid value(s): ${invalidSubtypes.join(", ")}. Valid subtypes are: ${VALID_SUBTYPES.join(", ")}`
          );
        }
        subtypes = rawSubtypes;
      }

      // Validate per_page
      const rawPerPage = args?.per_page;
      let perPage = 5;
      if (rawPerPage !== undefined) {
        if (typeof rawPerPage !== "number" || !Number.isFinite(rawPerPage)) {
          throw new McpError(ErrorCode.InvalidParams, "per_page must be a finite number");
        }
        if (!Number.isInteger(rawPerPage) || rawPerPage < 1 || rawPerPage > 100) {
          throw new McpError(ErrorCode.InvalidParams, "per_page must be an integer between 1 and 100");
        }
        perPage = rawPerPage;
      }

      const results = await searchWordPressDocs(query, subtypes, perPage);

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No results found. Please try a different keyword.",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }

    if (name === "get_wordpress_doc_content") {
      const subtype = args?.subtype as string;
      const id = args?.id as number;

      if (!subtype || typeof subtype !== "string") {
        throw new McpError(ErrorCode.InvalidParams, "subtype is required and must be a string");
      }

      // Validate subtype value
      if (!isValidSubtype(subtype)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid subtype: ${subtype}. Valid subtypes are: ${VALID_SUBTYPES.join(", ")}`
        );
      }

      if (id === undefined || id === null || typeof id !== "number") {
        throw new McpError(ErrorCode.InvalidParams, "id is required and must be a number");
      }

      // Validate id is a positive integer
      if (!Number.isInteger(id) || id < 1) {
        throw new McpError(ErrorCode.InvalidParams, "id must be a positive integer");
      }

      const content = await getWordPressDocContent(subtype, id);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(content, null, 2),
          },
        ],
      };
    }

    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP WordPress Docs server started");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
