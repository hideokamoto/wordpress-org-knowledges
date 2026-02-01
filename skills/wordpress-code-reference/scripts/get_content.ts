#!/usr/bin/env npx ts-node
/**
 * Get WordPress Code Reference content
 *
 * Usage: npx ts-node get_content.ts <subtype> <id>
 *
 * Arguments:
 *   subtype - Reference type: wp-parser-function, wp-parser-hook, wp-parser-class, wp-parser-method
 *   id      - Document ID from search results
 *
 * Example:
 *   npx ts-node get_content.ts wp-parser-function 12345
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

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: REQUEST_TIMEOUT }, (response) => {
      if (response.statusCode === 404) {
        response.resume();
        reject(new Error("Document not found"));
        return;
      }
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

// Simple HTML to text conversion for excerpts
function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface CodeRefContent {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  "wp-parser-since"?: string[];
  "wp-parser-source-file"?: string[];
}

async function getCodeRefContent(subtype: string, id: number): Promise<object> {
  if (!CODE_REF_SUBTYPES.includes(subtype)) {
    throw new Error(`Invalid subtype: ${subtype}. Valid: ${CODE_REF_SUBTYPES.join(", ")}`);
  }

  if (!Number.isInteger(id) || id < 1) {
    throw new Error("id must be a positive integer");
  }

  const url = `${API_BASE_URL}/${subtype}/${id}?_fields=id,title,excerpt,link,wp-parser-since,wp-parser-source-file`;
  const responseText = await httpsGet(url);
  const response: CodeRefContent = JSON.parse(responseText);

  if ((response as unknown as { code?: string }).code) {
    throw new Error((response as unknown as { message: string }).message);
  }

  const excerptText = htmlToText(response.excerpt.rendered);

  return {
    id: response.id,
    title: response.title.rendered,
    url: response.link,
    excerpt: excerptText,
    since: response["wp-parser-since"]?.[0] || null,
    source_file: response["wp-parser-source-file"]?.[0] || null,
  };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: get_content.ts <subtype> <id>");
    console.error("Example: get_content.ts wp-parser-function 12345");
    process.exit(1);
  }

  const subtype = args[0];
  const id = parseInt(args[1], 10);

  if (isNaN(id)) {
    console.error("Error: id must be a number");
    process.exit(1);
  }

  try {
    const content = await getCodeRefContent(subtype, id);
    console.log(JSON.stringify(content, null, 2));
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
