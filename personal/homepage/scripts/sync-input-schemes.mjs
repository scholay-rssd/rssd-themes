#!/usr/bin/env node
// Import the public RIMES catalog. ZIPs are copied only with --copy-downloads.
// Example: node scripts/sync-input-schemes.mjs --copy-downloads --max-download-bytes 1000000000
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// These pinned packages include jyut6ping3.maps.dict.yaml but omit its ODbL
// license. Keep their upstream catalog metadata; offer upstream links only
// until RIMES rebuilds the packages with the complete license attachments.
const excludedDownloads = new Set(["cantonese", "tupa", "combo-jyutping", "jyutgaan"]);
const options = {
  source: process.env.RSSD_RIMES_SOURCE || path.resolve(projectRoot, ".local/rimes"),
  output: path.join(projectRoot, "src/lib/input-schemes.json"),
  downloadDir: path.join(projectRoot, "public/downloads/rimes"),
  downloadBase: "/downloads/rimes",
  copyDownloads: false,
  maxDownloadBytes: 600_000_000,
};
const optionNames = {
  "--source": "source",
  "--output": "output",
  "--download-dir": "downloadDir",
  "--download-base": "downloadBase",
  "--max-download-bytes": "maxDownloadBytes",
};
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const argument = args[i];
  if (argument === "--copy-downloads") {
    options.copyDownloads = true;
  } else if (argument === "--help") {
    console.log(`Usage: node scripts/sync-input-schemes.mjs [options]

--source PATH               RIMES checkout (defaults to the local RIMES project)
--output PATH               Public JSON (defaults to src/lib/input-schemes.json)
--download-dir PATH         ZIP directory (defaults to public/downloads/rimes)
--download-base PATH        Public URL prefix (defaults to /downloads/rimes)
--copy-downloads            Copy only publishable ZIPs; verify bytes and SHA-256
--max-download-bytes NUMBER  Copy limit in bytes (default 600000000)

For the currently eligible collection (850449469 bytes, four incomplete packages excluded):
  node scripts/sync-input-schemes.mjs --copy-downloads --max-download-bytes 1000000000

Without --copy-downloads, downloadUrl is populated only for existing verified ZIPs.
The source catalog and RIMES checkout are never modified.`);
    process.exit(0);
  } else {
    const key = optionNames[argument];
    if (!key || !args[i + 1] || args[i + 1].startsWith("--")) {
      throw new Error(`Unknown option or missing value: ${argument}`);
    }
    options[key] = key === "maxDownloadBytes" ? Number(args[++i]) : args[++i];
  }
}
if (!Number.isSafeInteger(options.maxDownloadBytes) || options.maxDownloadBytes < 0) {
  throw new Error("--max-download-bytes must be a non-negative integer.");
}
if (!/^\/[A-Za-z0-9/_-]+$/.test(options.downloadBase) || options.downloadBase.includes("..")) {
  throw new Error("--download-base must be an absolute public path without traversal.");
}
options.downloadBase = options.downloadBase.replace(/\/$/, "");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function text(value, label, { empty = false, nullable = false } = {}) {
  if (nullable && value === null) return null;
  assert(typeof value === "string" && (empty || value.length > 0), `${label} must be a string.`);
  assert(!/[\u0000-\u001f\u007f]/.test(value), `${label} contains control characters.`);
  return value;
}
function number(value, label) {
  assert(typeof value === "number" && Number.isFinite(value) && value >= 0, `${label} must be a non-negative number.`);
  return value;
}
function boolean(value, label) {
  assert(typeof value === "boolean", `${label} must be a boolean.`);
  return value;
}
const categories = new Set(["phonetic", "shape", "phonetic-shape", "dialect", "auxiliary"]);
const statuses = new Set(["verified", "importer-ok", "lint-ok", "import-fails", "partial", "blocked", "rejected", "failed", "unbuilt"]);
const redistributions = new Set(["open", "restricted", "undeclared", "proprietary"]);
function publicPackage(record) {
  assert(record && typeof record === "object" && !Array.isArray(record), "Invalid package object.");
  const id = text(record.id, "package.id");
  assert(/^[a-z0-9][a-z0-9-]*$/.test(id), `Invalid package id: ${id}`);
  assert(categories.has(record.category), `${id}: invalid category.`);
  assert(statuses.has(record.status), `${id}: invalid status.`);
  assert(redistributions.has(record.redistribution), `${id}: invalid redistribution.`);
  const upstream = record.upstream;
  assert(upstream && typeof upstream === "object", `${id}: missing upstream.`);
  const repo = text(upstream.repo, `${id}.upstream.repo`);
  assert(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo), `${id}: invalid upstream repository.`);
  const url = text(upstream.url, `${id}.upstream.url`);
  assert(url === `https://github.com/${repo}`, `${id}: unexpected upstream URL.`);
  const revision = text(upstream.revision, `${id}.upstream.revision`);
  assert(/^[a-f0-9]{40}$/.test(revision), `${id}: expected a pinned upstream commit.`);
  const revisionDate = text(upstream.revisionDate, `${id}.upstream.revisionDate`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(revisionDate), `${id}: invalid revision date.`);
  const publishable = boolean(record.publishable, `${id}.publishable`);
  const archive = text(record.archive ?? "", `${id}.archive`, { empty: true });
  assert(!archive || /^rimes-scheme-[a-z0-9-]+-\d{8}\.[a-f0-9]{7}\.zip$/.test(archive), `${id}: invalid archive filename.`);
  const bytes = number(record.bytes ?? 0, `${id}.bytes`);
  assert(Number.isSafeInteger(bytes), `${id}: archive bytes must be an integer.`);
  const sha256 = text(record.sha256 ?? "", `${id}.sha256`, { empty: true });
  assert(!sha256 || /^[a-f0-9]{64}$/.test(sha256), `${id}: invalid SHA-256.`);
  if (publishable) {
    assert(record.status === "verified" && record.redistribution === "open", `${id}: publishable package has invalid status or redistribution.`);
    assert(archive && bytes > 0 && sha256, `${id}: publishable package lacks archive metadata.`);
    assert(record.engine?.deviceRisk !== "high", `${id}: high-risk package cannot be published.`);
  }
  const schemas = record.schemes ?? [];
  assert(Array.isArray(schemas), `${id}: schemes must be an array.`);
  let engine = null;
  if (record.engine) {
    assert(typeof record.engine === "object" && !Array.isArray(record.engine), `${id}: invalid engine metadata.`);
    engine = {};
    for (const key of ["deploySeconds", "peakMemoryMB"]) {
      if (record.engine[key] !== undefined) engine[key] = number(record.engine[key], `${id}.engine.${key}`);
    }
    if (record.engine.deviceRisk !== undefined) {
      assert(["low", "medium", "high"].includes(record.engine.deviceRisk), `${id}: invalid device risk.`);
      engine.deviceRisk = record.engine.deviceRisk;
    }
  }
  // Explicit allowlist: no diagnostic logs, local paths, probe text, or private notes.
  return {
    id,
    nameZH: text(record.nameZH, `${id}.nameZH`),
    nameEN: text(record.nameEN, `${id}.nameEN`),
    category: record.category,
    family: text(record.family, `${id}.family`),
    upstream: { url, repo, revision, revisionDate },
    license: text(record.license ?? null, `${id}.license`, { nullable: true }),
    redistribution: record.redistribution,
    status: record.status,
    publishable,
    archive,
    bytes,
    sha256,
    downloadUrl: null,
    schemes: schemas.map((schema) => ({
      id: text(schema.id, `${id}.scheme.id`),
      name: text(schema.name, `${id}.scheme.name`),
      recommended: boolean(schema.recommended, `${id}.scheme.recommended`),
      importable: boolean(schema.importable, `${id}.scheme.importable`),
    })),
    engine,
  };
}
async function fileHash(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}
async function matchesArchive(filePath, record) {
  try {
    const info = await stat(filePath);
    return info.isFile() && info.size === record.bytes && await fileHash(filePath) === record.sha256;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

const sourceIndex = path.resolve(options.source, "Catalog/input-schemes/index.json");
const source = JSON.parse(await readFile(sourceIndex, "utf8"));
assert(source && source.schemaVersion === 1 && source.packageFormat === 1 && Array.isArray(source.packages), "Unsupported RIMES catalog structure or version.");
const packages = source.packages.map(publicPackage);
assert(new Set(packages.map((record) => record.id)).size === packages.length, "Duplicate package ids.");
const publishable = packages.filter((record) => record.publishable);
const totalBytes = publishable.reduce((sum, record) => sum + record.bytes, 0);
const downloadable = publishable.filter((record) => !excludedDownloads.has(record.id));
const downloadableBytes = downloadable.reduce((sum, record) => sum + record.bytes, 0);
if (options.copyDownloads) {
  assert(downloadableBytes <= options.maxDownloadBytes, `Eligible archives total ${downloadableBytes} bytes, above limit ${options.maxDownloadBytes}. Use --max-download-bytes to set the intended limit.`);
  // Validate every source before copying any package.
  for (const record of downloadable) {
    const sourceArchive = path.resolve(options.source, "build/input-schemes/packages", record.archive);
    assert(await matchesArchive(sourceArchive, record), `${record.id}: source ZIP missing or mismatched bytes/SHA-256.`);
  }
  await mkdir(options.downloadDir, { recursive: true });
  for (const record of downloadable) {
    const target = path.resolve(options.downloadDir, record.archive);
    if (await matchesArchive(target, record)) continue;
    const temporary = `${target}.${process.pid}.tmp`;
    try {
      await copyFile(path.resolve(options.source, "build/input-schemes/packages", record.archive), temporary);
      assert(await matchesArchive(temporary, record), `${record.id}: copied ZIP mismatched bytes/SHA-256.`);
      await rename(temporary, target);
    } finally {
      await unlink(temporary).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
  }
}
const hosted = [];
for (const record of downloadable) {
  if (await matchesArchive(path.resolve(options.downloadDir, record.archive), record)) {
    record.downloadUrl = `${options.downloadBase}/${record.archive}`;
    hosted.push(record);
  }
}
if (hosted.length || options.copyDownloads) {
  await mkdir(options.downloadDir, { recursive: true });
  await writeFile(path.join(options.downloadDir, "SHA256SUMS"), hosted.map((record) => `${record.sha256}  ${record.archive}`).join("\n") + (hosted.length ? "\n" : ""));
}
const catalog = {
  updatedAt: (await stat(sourceIndex)).mtime.toISOString(),
  sourceUrl: "https://github.com/scholay/rimes/blob/main/Catalog/input-schemes/index.json",
  packages,
};
await mkdir(path.dirname(options.output), { recursive: true });
const outputTemporary = `${options.output}.${process.pid}.tmp`;
await writeFile(outputTemporary, JSON.stringify(catalog, null, 2) + "\n");
await rename(outputTemporary, options.output);
console.log(JSON.stringify({
  packages: packages.length,
  verified: packages.filter((record) => record.status === "verified").length,
  publishable: publishable.length,
  eligibleForDownload: downloadable.length,
  hosted: hosted.length,
  publishableArchiveBytes: totalBytes,
  downloadableArchiveBytes: downloadableBytes,
  excludedDownloads: [...excludedDownloads],
  categories: Object.fromEntries([...categories].map((category) => [category, packages.filter((record) => record.category === category).length])),
  updatedAt: catalog.updatedAt,
}, null, 2));
