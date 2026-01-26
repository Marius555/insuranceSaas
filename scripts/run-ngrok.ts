import { spawn, ChildProcess } from "child_process";
import http from "http";
import https from "https";
import path from "path";

// Configuration
const DEFAULT_PORT = 3000;
const NGROK_API_URL = "http://127.0.0.1:4040/api/tunnels";
const MAX_RETRIES = 20;
const RETRY_DELAY_MS = 1000;

interface NgrokTunnel {
  public_url: string;
  proto: string;
  config: {
    addr: string;
  };
}

interface NgrokApiResponse {
  tunnels: NgrokTunnel[];
}

function parsePort(): number {
  const arg = process.argv[2];
  if (!arg) return DEFAULT_PORT;

  const port = parseInt(arg, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(`Invalid port: ${arg}. Using default port ${DEFAULT_PORT}`);
    return DEFAULT_PORT;
  }
  return port;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    const req = client.get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(new Error(`Failed to parse JSON: ${data}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

function httpGet(url: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    const req = client.get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode || 0,
          body: data.substring(0, 500),
        });
      });
    });

    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

async function waitForNgrokTunnel(): Promise<string | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchJson<NgrokApiResponse>(NGROK_API_URL);

      // Prefer HTTPS tunnel
      const httpsTunnel = response.tunnels.find((t) => t.proto === "https");
      if (httpsTunnel) {
        return httpsTunnel.public_url;
      }

      // Fall back to any tunnel
      if (response.tunnels.length > 0) {
        return response.tunnels[0].public_url;
      }

      console.log(`Attempt ${attempt}/${MAX_RETRIES}: No tunnels found yet...`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes("ECONNREFUSED")) {
        console.log(`Attempt ${attempt}/${MAX_RETRIES}: ngrok API not ready...`);
      } else {
        console.log(`Attempt ${attempt}/${MAX_RETRIES}: ${errMsg}`);
      }
    }

    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS);
    }
  }

  return null;
}

async function testTunnel(url: string): Promise<boolean> {
  console.log(`\nTesting tunnel: ${url}`);

  try {
    const result = await httpGet(url);
    console.log(`Response status: ${result.statusCode}`);

    if (result.statusCode >= 200 && result.statusCode < 400) {
      console.log("Tunnel test: SUCCESS");
      return true;
    } else {
      console.log(`Tunnel test: Received status ${result.statusCode}`);
      return false;
    }
  } catch (error) {
    console.error("Tunnel test: FAILED");
    console.error(error instanceof Error ? error.message : error);
    return false;
  }
}

function getNgrokBinaryPath(): string {
  // Use the ngrok binary bundled with the npm package
  const ngrokDir = path.join(
    process.cwd(),
    "node_modules",
    "ngrok",
    "bin"
  );
  const binary = process.platform === "win32" ? "ngrok.exe" : "ngrok";
  return path.join(ngrokDir, binary);
}

function startNgrokProcess(port: number): ChildProcess {
  const ngrokPath = getNgrokBinaryPath();
  const args = ["http", String(port), "--log=stdout"];

  console.log(`Starting: ${ngrokPath} ${args.join(" ")}`);

  const ngrokProcess = spawn(ngrokPath, args, {
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  // Log ngrok output
  ngrokProcess.stdout?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      if (
        line.includes("error") ||
        line.includes("ERROR") ||
        line.includes("lvl=eror") ||
        line.includes("client session established")
      ) {
        console.log(`[ngrok] ${line.trim()}`);
      }
    }
  });

  ngrokProcess.stderr?.on("data", (data: Buffer) => {
    console.error(`[ngrok stderr] ${data.toString().trim()}`);
  });

  return ngrokProcess;
}

async function main(): Promise<void> {
  const port = parsePort();

  console.log("=".repeat(50));
  console.log("ngrok Tunnel Runner");
  console.log("=".repeat(50));
  console.log(`Target port: ${port}`);
  console.log("");

  // Start ngrok process directly
  console.log("Starting ngrok tunnel...");
  const ngrokProcess = startNgrokProcess(port);

  // Setup cleanup handler
  const cleanup = () => {
    console.log("\nShutting down ngrok...");
    ngrokProcess.kill();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  ngrokProcess.on("error", (err) => {
    console.error("\n" + "=".repeat(50));
    console.error("ERROR: Failed to start ngrok");
    console.error("=".repeat(50));
    console.error(err.message);
    console.error("\nPossible causes:");
    console.error("  1. ngrok binary not found");
    console.error("     -> Run: npm install ngrok");
    console.error("  2. ngrok requires authentication");
    console.error("     -> Run: npx ngrok config add-authtoken YOUR_TOKEN");
    process.exit(1);
  });

  ngrokProcess.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`ngrok exited with code ${code}`);
      process.exit(1);
    }
  });

  // Wait for tunnel to be established
  const publicUrl = await waitForNgrokTunnel();

  if (!publicUrl) {
    console.error("\n" + "=".repeat(50));
    console.error("ERROR: Failed to establish ngrok tunnel");
    console.error("=".repeat(50));
    console.error("\nPossible causes:");
    console.error("  1. ngrok requires authentication");
    console.error("     -> Run: npx ngrok config add-authtoken YOUR_TOKEN");
    console.error("  2. Another ngrok instance is already running");
    console.error("     -> Run: taskkill /F /IM ngrok.exe (Windows)");
    console.error("     -> Run: pkill ngrok (Mac/Linux)");
    console.error("  3. Firewall blocking ngrok");
    ngrokProcess.kill();
    process.exit(1);
  }

  console.log("\n" + "=".repeat(50));
  console.log("TUNNEL ESTABLISHED");
  console.log("=".repeat(50));
  console.log(`Public URL: ${publicUrl}`);
  console.log("=".repeat(50));

  // Test the tunnel
  const testPassed = await testTunnel(publicUrl);

  if (!testPassed) {
    console.log("\nNote: Tunnel test failed. This may be because:");
    console.log(`  - Your local server is not running on port ${port}`);
    console.log("  - The server is still starting up");
    console.log("\nThe tunnel is still active. Try accessing the URL manually.");
  }

  console.log("\n" + "-".repeat(50));
  console.log("Tunnel is running. Press Ctrl+C to stop.");
  console.log("-".repeat(50));

  // Keep the process running
  await new Promise(() => {});
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
