import { spawn } from "node:child_process";
import { Buffer } from "node:buffer";
import { stripAnsi } from "../utils/text";

export type PythonPackageStatus = {
  installed: boolean;
  installCommand: string;
  error?: string;
};

export function buildPythonPackageInstallCommand(pythonExe: string, packageName: string) {
  return `${pythonExe} -m pip install -U ${packageName}`;
}

export function checkPythonPackage(pythonExe: string, packageName: string, timeoutMs = 3500): Promise<PythonPackageStatus> {
  const installCommand = buildPythonPackageInstallCommand(pythonExe, packageName);
  return new Promise((resolve) => {
    const child = spawn(pythonExe, ["-c", `import ${packageName}`], { windowsHide: true });
    let done = false;
    let stdout = "";
    let stderr = "";

    const finish = (status: Omit<PythonPackageStatus, "installCommand">) => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      resolve({ ...status, installCommand });
    };

    const timeout = setTimeout(() => {
      child.kill();
      finish({ installed: false, error: `Timeout khi kiểm tra Python package ${packageName}.` });
    }, timeoutMs);

    child.stdout.on("data", (data: Buffer) => { stdout += data.toString("utf8"); });
    child.stderr.on("data", (data: Buffer) => { stderr += data.toString("utf8"); });
    child.on("error", (error) => {
      finish({ installed: false, error: `Không chạy được Python: ${error.message}` });
    });
    child.on("close", (code) => {
      const cleanStdout = stripAnsi(stdout).trim();
      const cleanStderr = stripAnsi(stderr).trim();
      finish({
        installed: code === 0,
        error: code === 0 ? undefined : cleanStderr || cleanStdout || `Python không import được ${packageName}.`,
      });
    });
  });
}
