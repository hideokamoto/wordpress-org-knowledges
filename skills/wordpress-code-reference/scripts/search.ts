#!/usr/bin/env npx ts-node
/**
 * Search WordPress Code Reference
 *
 * Usage: npx ts-node search.ts <query> [subtypes] [per_page]
 *
 * Arguments:
 *   query    - Search keywords (required)
 *   subtypes - Comma-separated list: wp-parser-function,wp-parser-hook,wp-parser-class,wp-parser-method
 *   per_page - Number of results (1-100, default: 5)
 *
 * Example:
 *   npx ts-node search.ts "register_post_type" "wp-parser-function" 5
 */

import * as https from "https";

const API_BASE_URL = "https://developer.wordpress.org/wp-json/wp/v2";
const REQUEST_TIMEOUT = 10000;

const CODE_REF_SUBTYPES = [
  "wp-parser-function",
  "wp-parser-hook",
  "wp-parser-class",
  "wp-parser-method",
];

interface SearchResult {
  id: number;
  title: string;
  url: string;
  subtype: string;
}

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: REQUEST_TIMEOUT }, (response) => {
      if (response.statusCode && response.statusCode >= 400) {
        response.resume();
        reject(new Error(`HTTP error ${response.statusCode}`));
        return;
      }

      let data = "";
      response.on("data", (chunk) => { data += chunk; });
      response.on("end", () => { resolve(data); });
    });

    request.on("error", (error) => reject(new Error(`Network error: ${error.message}`)));
    request.on("timeout", () => { request.destroy(); reject(new Error("Request timeout")); });
  });
}

async function searchCodeReference(
  query: string,
  subtypes?: string[],
  perPage: number = 5
): Promise<SearchResult[]> {
  // Validate subtypes
  if (subtypes && subtypes.length > 0) {
    const invalid = subtypes.filter((s) => !CODE_REF_SUBTYPES.includes(s));
    if (invalid.length > 0) {
      throw new Error(`Invalid subtypes: ${invalid.join(", ")}. Valid: ${CODE_REF_SUBTYPES.join(", ")}`);
    }
  }

  const params = new URLSearchParams({
    search: query,
    per_page: Math.min(Math.max(1, perPage), 100).toString(),
    _fields: "id,title,url,subtype",
  });

  if (subtypes && subtypes.length > 0) {
    params.set("subtype", subtypes.join(","));
  } else {
    params.set("subtype", CODE_REF_SUBTYPES.join(","));
  }

  const url = `${API_BASE_URL}/search?${params.toString()}`;
  const responseText = await httpsGet(url);
  const response = JSON.parse(responseText);

  if (!Array.isArray(response)) {
    throw new Error(response.message || "Unexpected API response");
  }

  return response.map((item: { id: number; title: string; url: string; subtype: string }) => ({
    id: item.id,
    title: item.title,
    url: item.url,
    subtype: item.subtype,
  }));
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: search.ts <query> [subtypes] [per_page]");
    console.error("Example: search.ts \"add_action\" \"wp-parser-function,wp-parser-hook\" 5");
    process.exit(1);
  }

  const query = args[0];
  const subtypes = args[1] ? args[1].split(",").map((s) => s.trim()) : undefined;
  const perPage = args[2] ? parseInt(args[2], 10) : 5;

  try {
    const results = await searchCodeReference(query, subtypes, perPage);

    if (results.length === 0) {
      console.log("No results found. Try different keywords.");
    } else {
      console.log(JSON.stringify(results, null, 2));
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
