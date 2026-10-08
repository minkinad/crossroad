import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

if (!existsSync(".env"))
  throw new Error("Create .env from .env.example and set its secrets first.");
process.loadEnvFile(".env");
const program = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const child = spawn(program, process.argv.slice(2), {
  env: process.env,
  stdio: "inherit",
});
child.once("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.once("exit", (code) => {
  process.exitCode = code ?? 1;
});
