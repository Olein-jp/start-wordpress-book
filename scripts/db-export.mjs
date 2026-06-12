import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const dumpDir = path.resolve("database");
const dumpPath = path.join(dumpDir, "start-wordpress-book.sql");
const containerDumpPath = "/tmp/start-wordpress-book.sql";
const cliContainerPattern = /^wp-env-start-wordpress-book-[^-]+-cli-1$/;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function capture(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout;
}

function getCliContainerName() {
  const names = capture("docker", ["ps", "--format", "{{.Names}}"])
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean);

  const containerName = names.find((name) => cliContainerPattern.test(name));

  if (!containerName) {
    console.error("wp-env CLI container was not found. Run `npm run env:start` first.");
    process.exit(1);
  }

  return containerName;
}

mkdirSync(dumpDir, {
  recursive: true,
});

run("wp-env", [
  "run",
  "cli",
  "wp",
  "db",
  "export",
  containerDumpPath,
  "--add-drop-table",
  "--single-transaction",
  "--default-character-set=utf8mb4",
]);

const cliContainerName = getCliContainerName();

rmSync(dumpPath, {
  force: true,
});

run("docker", ["cp", `${cliContainerName}:${containerDumpPath}`, dumpPath]);

console.log(`Exported database: ${dumpPath}`);
