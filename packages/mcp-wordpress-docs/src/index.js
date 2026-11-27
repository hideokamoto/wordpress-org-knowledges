#!/usr/bin/env node
// @ts-check

import { readFileSync } from "node:fs";
import * as https from "node:https";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import TurndownService from "turndown";

/** @type {{ name: string; version: string }} */
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

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
];

const CODE_REF_SUBTYPES = [
  "wp-parser-function",
  "wp-parser-hook",
  "wp-parser-class",
  "wp-parser-method",
];

const VALID_SUBTYPES = [...HANDBOOK_SUBTYPES, ...CODE_REF_SUBTYPES];

/**
 * Annotations shared by every tool. Both tools only send GET requests to
 * developer.wordpress.org and never change anything, so they are read-only,
 * non-destructive and idempotent. They reach an external website, so they are
 * open-world.
 */
const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

// Turndown instance for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

const USER_AGENT = `${packageJson.name}/${packageJson.version} (+https://github.com/hideokamoto/wordpress-org-knowledges)`;
const MAX_RETRIES = 2;
const MAX_RETRY_DELAY = 5000;

/**
 * Thrown when developer.wordpress.org answers 429 or 503, which are worth
 * trying again after a short wait.
 */
class RetryableHttpError extends Error {
  /** @param {string} message @param {number} delay */
  constructor(message, delay) {
    super(message);
    this.delay = delay;
  }
}

/**
 * @param {string | string[] | undefined} header
 * @param {number} fallback
 * @returns {number}
 */
function retryDelay(header, fallback) {
  const value = (Array.isArray(header) ? header[0] : header)?.trim() ?? "";
  let delay = fallback;
  if (/^\d+$/.test(value)) {
    // Retry-After: <seconds>
    delay = Number(value) * 1000;
  } else if (value) {
    // Retry-After: <HTTP-date>
    const date = Date.parse(value);
    if (Number.isFinite(date)) delay = Math.max(0, date - Date.now());
  }
  return Math.min(delay, MAX_RETRY_DELAY);
}

/**
 * One HTTP GET request.
 * @param {string} url
 * @param {number} attempt
 * @returns {Promise<string>}
 */
function httpsGetOnce(url, attempt) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      { timeout: REQUEST_TIMEOUT, headers: { "User-Agent": USER_AGENT, Accept: "application/json" } },
      (response) => {
        const status = response.statusCode ?? 0;
        if (status === 404) {
          response.resume(); // Consume response to free up socket
          reject(new Error(`Document not found (404): ${url}`));
          return;
        }

        if (status === 429 || status === 503) {
          response.resume();
          reject(
            new RetryableHttpError(
              `HTTP error ${status}: developer.wordpress.org is limiting requests, try again later: ${url}`,
              retryDelay(response.headers["retry-after"], 1000 * 2 ** attempt)
            )
          );
          return;
        }

        if (status >= 400) {
          response.resume(); // Consume response to free up socket
          reject(new Error(`HTTP error ${status}: ${url}`));
          return;
        }

        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          resolve(data);
        });
        response.on("error", (error) => {
          reject(new Error(`Stream error: ${error.message} (${url})`));
        });
      }
    );

    request.on("error", (error) => {
      reject(new Error(`Network error: ${error.message} (${url})`));
    });

    request.on("timeout", () => {
      request.destroy();
      reject(new Error(`Request timeout after ${REQUEST_TIMEOUT}ms: ${url}`));
    });
  });
}

/**
 * HTTP GET helper. Retries a 429 or 503 answer up to MAX_RETRIES times.
 * @param {string} url
 * @returns {Promise<string>}
 */
async function httpsGet(url) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await httpsGetOnce(url, attempt);
    } catch (error) {
      if (!(error instanceof RetryableHttpError) || attempt >= MAX_RETRIES) throw error;
      await new Promise((resolve) => setTimeout(resolve, error.delay));
    }
  }
}

/**
 * @param {string} subtype
 * @returns {boolean}
 */
function isValidSubtype(subtype) {
  return VALID_SUBTYPES.includes(subtype);
}

/**
 * @param {string} subtype
 * @returns {boolean}
 */
function isHandbookSubtype(subtype) {
  return HANDBOOK_SUBTYPES.includes(subtype);
}

/**
 * @param {string} subtype
 * @returns {boolean}
 */
function isCodeRefSubtype(subtype) {
  return CODE_REF_SUBTYPES.includes(subtype);
}

/**
 * Throws when a WordPress REST API response is an error object.
 * @param {unknown} response
 */
function throwIfApiError(response) {
  if (response && typeof response === "object" && "code" in response) {
    const message =
      "message" in response ? String(response.message) : String(response.code);
    throw new Error(`API error: ${message}`);
  }
}

/**
 * @typedef {object} SearchResult
 * @property {number} id
 * @property {string} title
 * @property {string} url
 * @property {string} subtype
 */

/**
 * Tool: search_wordpress_docs
 * @param {string} query
 * @param {string[]} [subtypes]
 * @param {number} [perPage]
 * @returns {Promise<SearchResult[]>}
 */
async function searchWordPressDocs(query, subtypes, perPage = 5) {
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
    return response.map(
      /** @param {SearchResult} item */
      (item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        subtype: item.subtype,
      })
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse API response: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Tool: get_wordpress_doc_content
 * @param {string} subtype
 * @param {number} id
 * @returns {Promise<object>}
 */
async function getWordPressDocContent(subtype, id) {
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
      const response = JSON.parse(responseText);
      throwIfApiError(response);

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
      const response = JSON.parse(responseText);
      throwIfApiError(response);

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
    name: packageJson.name,
    version: packageJson.version,
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
        title: "Search WordPress developer docs",
        description:
          "Search WordPress developer documentation including handbooks (Plugin, Theme, Block Editor, REST API, Common APIs, Coding Standards, Advanced Administration) and code references (functions, hooks, classes, methods). Returns a list of matching documents with IDs, titles, URLs, and types. Use this to find relevant documentation before retrieving full content.",
        annotations: {
          title: "Search WordPress developer docs",
          ...READ_ONLY_ANNOTATIONS,
        },
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Search keywords (e.g., 'register_post_type', 'custom post type', 'add_action')",
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
        title: "Get a WordPress doc page",
        description:
          "Retrieve the full content of a specific WordPress documentation page. For handbooks, returns the complete content in Markdown format. For code references (functions, hooks, classes, methods), returns the excerpt/description along with metadata like 'since' version and source file location. Use the ID and subtype from search_wordpress_docs results.",
        annotations: {
          title: "Get a WordPress doc page",
          ...READ_ONLY_ANNOTATIONS,
        },
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
      const query = args?.query;

      if (!query || typeof query !== "string") {
        throw new McpError(
          ErrorCode.InvalidParams,
          "query is required and must be a string"
        );
      }

      // Validate subtypes
      const rawSubtypes = args?.subtypes;
      /** @type {string[] | undefined} */
      let subtypes;
      if (rawSubtypes !== undefined) {
        if (
          !Array.isArray(rawSubtypes) ||
          !rawSubtypes.every((s) => typeof s === "string")
        ) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "subtypes must be an array of strings"
          );
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
          throw new McpError(
            ErrorCode.InvalidParams,
            "per_page must be a finite number"
          );
        }
        if (
          !Number.isInteger(rawPerPage) ||
          rawPerPage < 1 ||
          rawPerPage > 100
        ) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "per_page must be an integer between 1 and 100"
          );
        }
        perPage = rawPerPage;
      }

      const results = await searchWordPressDocs(query, subtypes, perPage);

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
      const subtype = args?.subtype;
      const id = args?.id;

      if (!subtype || typeof subtype !== "string") {
        throw new McpError(
          ErrorCode.InvalidParams,
          "subtype is required and must be a string"
        );
      }

      // Validate subtype value
      if (!isValidSubtype(subtype)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid subtype: ${subtype}. Valid subtypes are: ${VALID_SUBTYPES.join(", ")}`
        );
      }

      if (id === undefined || id === null || typeof id !== "number") {
        throw new McpError(
          ErrorCode.InvalidParams,
          "id is required and must be a number"
        );
      }

      // Validate id is a positive integer
      if (!Number.isInteger(id) || id < 1) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "id must be a positive integer"
        );
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
