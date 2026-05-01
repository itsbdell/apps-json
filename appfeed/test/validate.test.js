import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createServer } from "node:http";

const exec = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "fixtures");
const BIN = join(__dirname, "..", "bin", "appfeed.js");
const EXAMPLE = join(__dirname, "..", "..", "spec", "apps.example.json");

async function run(args) {
  try {
    const { stdout, stderr } = await exec(process.execPath, [BIN, ...args], { encoding: "utf8" });
    return { code: 0, stdout, stderr };
  } catch (e) {
    return { code: e.code ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

before(async () => {
  await mkdir(FIXTURES, { recursive: true });
  await writeFile(
    join(FIXTURES, "valid-minimal.json"),
    JSON.stringify({ version: "1.0", apps: [{ name: "Hi", url: "https://example.com" }] })
  );
  await writeFile(
    join(FIXTURES, "missing-version.json"),
    JSON.stringify({ apps: [] })
  );
  await writeFile(
    join(FIXTURES, "missing-app-url.json"),
    JSON.stringify({ version: "1.0", apps: [{ name: "Bad" }] })
  );
  await writeFile(
    join(FIXTURES, "extra-fields.json"),
    JSON.stringify({
      version: "1.0",
      custom_field: "should be allowed",
      apps: [{ name: "X", url: "https://example.com", "x-foo": 42 }]
    })
  );
  await writeFile(
    join(FIXTURES, "empty-apps.json"),
    JSON.stringify({ version: "1.0", apps: [] })
  );
  await writeFile(join(FIXTURES, "broken.json"), "{ not json");
});

after(async () => {
  await rm(FIXTURES, { recursive: true, force: true });
});

test("happy path: example feed validates clean", async () => {
  const { code, stdout } = await run(["validate", EXAMPLE]);
  assert.equal(code, 0);
  assert.match(stdout, /valid/);
  assert.match(stdout, /3 apps/);
});

test("happy path: --json on success emits parseable JSON", async () => {
  const { code, stdout } = await run(["validate", EXAMPLE, "--json"]);
  assert.equal(code, 0);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.appCount, 3);
  assert.equal(parsed.feedVersion, "1.0");
});

test("happy path: minimal valid feed passes", async () => {
  const { code } = await run(["validate", join(FIXTURES, "valid-minimal.json")]);
  assert.equal(code, 0);
});

test("edge case: extra unknown top-level fields are tolerated", async () => {
  const { code } = await run(["validate", join(FIXTURES, "extra-fields.json")]);
  assert.equal(code, 0);
});

test("edge case: empty apps array is valid", async () => {
  const { code, stdout } = await run(["validate", join(FIXTURES, "empty-apps.json")]);
  assert.equal(code, 0);
  assert.match(stdout, /0 apps/);
});

test("error path: missing top-level version exits 1", async () => {
  const { code, stderr } = await run(["validate", join(FIXTURES, "missing-version.json")]);
  assert.equal(code, 1);
  assert.match(stderr, /version/i);
});

test("error path: missing app url exits 1 with /apps/0 path", async () => {
  const { code, stderr } = await run(["validate", join(FIXTURES, "missing-app-url.json")]);
  assert.equal(code, 1);
  assert.match(stderr, /\/apps\/0/);
});

test("error path: invalid JSON exits 2", async () => {
  const { code, stderr } = await run(["validate", join(FIXTURES, "broken.json")]);
  assert.equal(code, 2);
  assert.match(stderr, /Invalid JSON/i);
});

test("error path: nonexistent file exits 2", async () => {
  const { code, stderr } = await run(["validate", "/no/such/file.json"]);
  assert.equal(code, 2);
  assert.match(stderr, /Could not read/);
});

test("error path: --json on schema failure emits parseable JSON", async () => {
  const { code, stdout } = await run([
    "validate",
    join(FIXTURES, "missing-version.json"),
    "--json"
  ]);
  assert.equal(code, 1);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.kind, "schema");
  assert.ok(Array.isArray(parsed.errors));
  assert.ok(parsed.errors.length > 0);
});

test("integration: validates a feed served over HTTP", async () => {
  const server = createServer((req, res) => {
    if (req.url === "/apps.json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        version: "1.0",
        apps: [{ name: "Net", url: "https://example.com" }]
      }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();
  try {
    const { code, stdout } = await run(["validate", `http://127.0.0.1:${port}/apps.json`]);
    assert.equal(code, 0);
    assert.match(stdout, /valid/);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test("error path: HTTP 404 exits 2", async () => {
  const server = createServer((_req, res) => {
    res.writeHead(404);
    res.end("not found");
  });
  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();
  try {
    const { code, stderr } = await run(["validate", `http://127.0.0.1:${port}/missing.json`]);
    assert.equal(code, 2);
    assert.match(stderr, /404/);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test("stub commands: each prints coming-soon message and exits 64 (EX_USAGE)", async () => {
  for (const stub of ["fetch", "follow", "list", "update"]) {
    const { code, stderr } = await run([stub, "https://example.com"]);
    assert.equal(code, 64, `${stub} should exit 64 (EX_USAGE), got ${code}`);
    assert.match(stderr, /coming/i, `${stub} should mention 'coming'`);
  }
});

test("error path: --json on nonexistent file emits kind:'fs'", async () => {
  const { code, stdout } = await run(["validate", "/no/such/file.json", "--json"]);
  assert.equal(code, 2);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.kind, "fs");
});

test("error path: --json on broken JSON emits kind:'parse'", async () => {
  const { code, stdout } = await run([
    "validate",
    join(FIXTURES, "broken.json"),
    "--json"
  ]);
  assert.equal(code, 2);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.kind, "parse");
});
