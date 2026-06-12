import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const dumpPath = path.resolve("database/start-wordpress-book.sql");
const containerDumpPath = "/tmp/start-wordpress-book-import.sql";
const cliContainerPattern = /^wp-env-start-wordpress-book-[^-]+-cli-1$/;
const confirmed = process.argv.includes("--yes");

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

if (!confirmed) {
  console.error("DB import overwrites the current wp-env database.");
  console.error("Run `npm run db:import -- --yes` if you want to continue.");
  process.exit(1);
}

if (!existsSync(dumpPath)) {
  console.error(`Database dump was not found: ${dumpPath}`);
  process.exit(1);
}

const cliContainerName = getCliContainerName();

run("docker", ["cp", dumpPath, `${cliContainerName}:${containerDumpPath}`]);
run("wp-env", ["run", "cli", "wp", "db", "import", containerDumpPath]);

console.log(`Imported database: ${dumpPath}`);
