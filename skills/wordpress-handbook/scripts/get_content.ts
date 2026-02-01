#!/usr/bin/env npx ts-node
/**
 * Get WordPress Handbook document content
 *
 * Usage: npx ts-node get_content.ts <subtype> <id>
 *
 * Arguments:
 *   subtype - Handbook type (e.g., plugin-handbook, theme-handbook)
 *   id      - Document ID from search results
 *
 * Example:
 *   npx ts-node get_content.ts plugin-handbook 12345
 */

import * as https from "https";

const API_BASE_URL = "https://developer.wordpress.org/wp-json/wp/v2";
const REQUEST_TIMEOUT = 10000;

const HANDBOOK_SUBTYPES = [
  "plugin-handbook",
  "theme-handbook",
  "blocks-handbook",
  "rest-api-handbook",
  "apis-handbook",
  "wpcs-handbook",
  "adv-admin-handbook",
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

// Simple HTML to Markdown conversion
function htmlToMarkdown(html: string): string {
  return html
    // Remove scripts and styles
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    // Headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n")
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n\n")
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n\n")
    // Code blocks
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "```\n$1\n```\n\n")
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "```\n$1\n```\n\n")
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
    // Links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    // Bold and italic
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
    // Lists
    .replace(/<ul[^>]*>/gi, "\n")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<ol[^>]*>/gi, "\n")
    .replace(/<\/ol>/gi, "\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
    // Paragraphs and line breaks
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n---\n\n")
    // Blockquotes
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "> $1\n\n")
    // Remove remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up extra whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface HandbookContent {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  link: string;
}

async function getHandbookContent(subtype: string, id: number): Promise<object> {
  if (!HANDBOOK_SUBTYPES.includes(subtype)) {
    throw new Error(`Invalid subtype: ${subtype}. Valid: ${HANDBOOK_SUBTYPES.join(", ")}`);
  }

  if (!Number.isInteger(id) || id < 1) {
    throw new Error("id must be a positive integer");
  }

  const url = `${API_BASE_URL}/${subtype}/${id}?_fields=id,title,content,link`;
  const responseText = await httpsGet(url);
  const response: HandbookContent = JSON.parse(responseText);

  if ((response as unknown as { code?: string }).code) {
    throw new Error((response as unknown as { message: string }).message);
  }

  const markdownContent = htmlToMarkdown(response.content.rendered);

  return {
    id: response.id,
    title: response.title.rendered,
    url: response.link,
    content: markdownContent,
  };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: get_content.ts <subtype> <id>");
    console.error("Example: get_content.ts plugin-handbook 12345");
    process.exit(1);
  }

  const subtype = args[0];
  const id = parseInt(args[1], 10);

  if (isNaN(id)) {
    console.error("Error: id must be a number");
    process.exit(1);
  }

  try {
    const content = await getHandbookContent(subtype, id);
    console.log(JSON.stringify(content, null, 2));
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
