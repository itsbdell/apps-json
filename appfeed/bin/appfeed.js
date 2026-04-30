#!/usr/bin/env node
import { Command } from "commander";
import { validateCmd } from "../src/validate.js";

const program = new Command();

program
  .name("appfeed")
  .description("Reference CLI for the apps.json standard")
  .version("0.1.0");

program
  .command("validate <urlOrPath>")
  .description("Validate an apps.json against the v1.0 schema")
  .option("--json", "emit machine-readable JSON output")
  .action(async (urlOrPath, options) => {
    const code = await validateCmd(urlOrPath, options);
    process.exit(code);
  });

for (const stub of ["fetch", "follow", "list", "update"]) {
  program
    .command(`${stub} [args...]`)
    .description(`(coming soon) ${stub}`)
    .action(() => {
      console.error(`appfeed ${stub}: coming in a later release. v0.1 ships 'validate' only.`);
      process.exit(1);
    });
}

await program.parseAsync();
