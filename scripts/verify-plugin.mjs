#!/usr/bin/env node
// Checks that the Claude plugin bundle in this repository starts and exposes
// tools that meet the Claude directory requirements.
//
// It starts the MCP server exactly as .claude-plugin/plugin.json declares it,
// with ${CLAUDE_PLUGIN_ROOT} replaced by the plugin root, and resolves the
// server's packages from the plugin root's node_modules, which is what Claude
// Code installs from the root package.json and package-lock.json.
//
// Usage:
//   node scripts/verify-plugin.mjs [--root <plugin root>] [--live]
//
//   --root  Plugin root to check (default: this repository). Point it at an
//           installed copy of the plugin to check that copy.
//   --live  Also call both tools against developer.wordpress.org.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const rootFlag = args.indexOf("--root");
const pluginRoot = path.resolve(rootFlag >= 0 ? args[rootFlag + 1] : repoRoot);
const live = args.includes("--live");

/** @type {string[]} */
const failures = [];
/** @param {boolean} ok @param {string} message */
function check(ok, message) {
  console.log(`${ok ? "✓" : "✗"} ${message}`);
  if (!ok) failures.push(message);
}

/** @param {string} file */
function readJson(file) {
  return JSON.parse(readFileSync(path.join(pluginRoot, file), "utf8"));
}

const manifest = readJson(".claude-plugin/plugin.json");
const rootPackage = readJson("package.json");
const serverPackage = readJson("packages/mcp-wordpress-docs/package.json");

// Claude Code installs only what the plugin root's package.json lists, so the
// root must list exactly the server's runtime dependencies.
check(
  isDeepStrictEqual(rootPackage.dependencies, serverPackage.dependencies),
  "root package.json dependencies match packages/mcp-wordpress-docs/package.json"
);

// Claude Code skips the install unless every dependency is pinned exactly.
const unpinned = Object.entries(rootPackage.dependencies ?? {}).filter(
  ([, version]) => !/^\d+\.\d+\.\d+$/.test(String(version))
);
check(unpinned.length === 0, "root dependencies are pinned to exact versions");

check(
  manifest.version === serverPackage.version,
  `plugin.json version (${manifest.version}) matches the MCP server package version (${serverPackage.version})`
);

const servers = Object.entries(manifest.mcpServers ?? {});
check(servers.length > 0, "plugin.json declares an MCP server");

for (const [serverName, config] of servers) {
  const expand = (/** @type {string} */ value) =>
    value.replaceAll("${CLAUDE_PLUGIN_ROOT}", pluginRoot);
  const transport = new StdioClientTransport({
    command: config.command,
    args: (config.args ?? []).map(expand),
    cwd: pluginRoot,
    stderr: "pipe",
  });
  const client = new Client({ name: "verify-plugin", version: "0.0.0" });

  try {
    await client.connect(transport);
    check(true, `${serverName}: server starts and completes the MCP handshake`);

    const { tools } = await client.listTools();
    check(tools.length > 0, `${serverName}: lists ${tools.length} tool(s)`);

    for (const tool of tools) {
      const a = tool.annotations ?? {};
      check(tool.name.length <= 64, `${tool.name}: name is 64 characters or fewer`);
      check(Boolean(tool.title), `${tool.name}: has a title`);
      check(Boolean(a.title), `${tool.name}: has annotations.title`);
      check(typeof a.readOnlyHint === "boolean", `${tool.name}: sets readOnlyHint`);
      check(typeof a.destructiveHint === "boolean", `${tool.name}: sets destructiveHint`);
    }

    if (live) {
      const search = await client.callTool({
        name: "search_wordpress_docs",
        arguments: { query: "register_post_type", subtypes: ["wp-parser-function"], per_page: 1 },
      });
      const searchText = /** @type {{ text: string }[]} */ (search.content)[0]?.text ?? "";
      check(!search.isError, `search_wordpress_docs returns results: ${searchText.slice(0, 120)}`);

      const [first] = JSON.parse(searchText);
      if (first) {
        const doc = await client.callTool({
          name: "get_wordpress_doc_content",
          arguments: { subtype: first.subtype, id: first.id },
        });
        const docText = /** @type {{ text: string }[]} */ (doc.content)[0]?.text ?? "";
        check(!doc.isError, `get_wordpress_doc_content returns the page: ${docText.slice(0, 120)}`);
      }
    }
  } catch (error) {
    check(false, `${serverName}: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await client.close().catch(() => {});
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nAll plugin checks passed");
