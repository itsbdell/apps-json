import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import pc from "picocolors";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "schema.json");

let cachedValidator = null;

async function getValidator() {
  if (cachedValidator) return cachedValidator;
  const schemaText = await readFile(schemaPath, "utf8");
  const schema = JSON.parse(schemaText);
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats.default(ajv);
  cachedValidator = ajv.compile(schema);
  return cachedValidator;
}

async function load(urlOrPath) {
  if (/^https?:\/\//i.test(urlOrPath)) {
    let res;
    try {
      res = await fetch(urlOrPath, {
        headers: { "User-Agent": "appfeed/0.1 (+https://apps-json.org)" },
        redirect: "follow"
      });
    } catch (e) {
      const err = new Error(`Network error fetching ${urlOrPath}: ${e.message}`);
      err.kind = "network";
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} ${res.statusText} from ${urlOrPath}`);
      err.kind = "network";
      err.status = res.status;
      throw err;
    }
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      const err = new Error(`Invalid JSON from ${urlOrPath}: ${e.message}`);
      err.kind = "parse";
      throw err;
    }
  }

  let text;
  try {
    text = await readFile(urlOrPath, "utf8");
  } catch (e) {
    const err = new Error(`Could not read ${urlOrPath}: ${e.message}`);
    err.kind = "network";
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    const err = new Error(`Invalid JSON in ${urlOrPath}: ${e.message}`);
    err.kind = "parse";
    throw err;
  }
}

export async function validateCmd(urlOrPath, options = {}) {
  const json = !!options.json;

  let data;
  try {
    data = await load(urlOrPath);
  } catch (e) {
    if (json) {
      console.log(JSON.stringify({ ok: false, kind: e.kind || "error", error: e.message }));
    } else {
      console.error(pc.red(`✖ ${e.message}`));
    }
    return 2;
  }

  const validator = await getValidator();
  const ok = validator(data);

  if (ok) {
    const appCount = Array.isArray(data.apps) ? data.apps.length : 0;
    if (json) {
      console.log(JSON.stringify({
        ok: true,
        appCount,
        feedVersion: data.version ?? null,
        updated: data.updated ?? null
      }));
    } else {
      console.log(pc.green(`✔ apps.json v${data.version} — valid`));
      console.log(`  ${appCount} app${appCount === 1 ? "" : "s"}`);
      if (data.updated) console.log(`  feed updated ${data.updated}`);
    }
    return 0;
  }

  const errors = (validator.errors || []).map(err => ({
    path: err.instancePath || "/",
    message: err.message,
    keyword: err.keyword,
    params: err.params
  }));

  if (json) {
    console.log(JSON.stringify({ ok: false, kind: "schema", errors }));
  } else {
    console.error(pc.red(`✖ apps.json — ${errors.length} error${errors.length === 1 ? "" : "s"}`));
    for (const err of errors) {
      const loc = err.path || "/";
      console.error(`  ${pc.dim(loc)}  ${err.message}`);
    }
  }
  return 1;
}
