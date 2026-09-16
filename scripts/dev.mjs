import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function start(label, executable, args, cwd) {
  const child = spawn(executable, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });

  child.on("error", (error) => {
    console.error(`\n[${label}] Failed to start: ${error.message}`);
    if (label === "backend") {
      console.error("Install the backend dependencies with: python -m pip install -r backend/requirements.txt");
    }
    shutdown(1);
  });

  child.on("exit", (code) => {
    if (!stopping) {
      console.error(`\n[${label}] stopped unexpectedly (exit code ${code ?? "unknown"}).`);
      shutdown(code ?? 1);
    }
  });
  return child;
}

let stopping = false;
const backend = start("backend", "python", ["-m", "uvicorn", "main:app", "--reload", "--port", "8000"], path.join(root, "backend"));
const frontend = start("frontend", process.execPath, [path.join(root, "node_modules", "vite", "bin", "vite.js")], root);

function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  backend.kill();
  frontend.kill();
  process.exit(exitCode);
}

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
