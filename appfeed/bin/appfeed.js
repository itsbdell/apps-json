#!/usr/bin/env node
import { Command } from "commander";
import { validateCmd } from "../src/validate.js";

// Exit codes (mirrors validate.js):
//   0  — success
//   1  — schema-validation failure
//   2  — input failure (parse, network, http, timeout, fs)
//  64  — usage error / unimplemented command (matches sysexits.h EX_USAGE)
const EXIT_USAGE = 64;

const program = new Command();

program
  .name("appfeed")
  .description("Reference CLI for the apps.json standard\n\nExit codes: 0=valid, 1=schema error, 2=input error (parse/network/http/timeout/fs), 64=usage / not implemented.")
  .version("0.1.0");

program
  .command("validate <urlOrPath>")
  .description("Validate an apps.json against the v1.0 schema. Exits 0 on success, 1 on schema error, 2 on parse/network/http/timeout/fs error.")
  .option("--json", "emit machine-readable JSON output")
  .action(async (urlOrPath, options) => {
    const code = await validateCmd(urlOrPath, options);
    process.exit(code);
  });

for (const stub of ["fetch", "follow", "list", "update"]) {
  program
    .command(`${stub} [args...]`)
    .description(`(coming soon) ${stub} — see https://github.com/itsbdell/apps-json/issues for roadmap`)
    .action(() => {
      console.error(`appfeed ${stub}: coming in a later release. v0.1 ships 'validate' only.`);
      console.error(`Track progress at https://github.com/itsbdell/apps-json/issues`);
      process.exit(EXIT_USAGE);
    });
}

await program.parseAsync();
