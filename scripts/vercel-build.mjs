import { spawnSync } from "node:child_process";

function run(script) {
  const windows = process.platform === "win32";
  const result = spawnSync(
    windows ? "cmd.exe" : "npm",
    windows ? ["/d", "/s", "/c", `npm run ${script}`] : ["run", script],
    { stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL_ENV === "production") run("db:deploy");
run("build");
