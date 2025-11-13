## What Happened
- Another `next dev` instance is running and holds `.next/dev/lock`. A new instance tried port `3001` but failed due to the lock.
- The lock file exists at `/.next/dev/lock` for this project path; only one dev instance can run per project.
- Current scripts: `package.json:5-11` show `dev` → `next dev`.

## Fix Steps (macOS)
- Identify running Next.js dev:
  - `lsof -iTCP -sTCP:LISTEN -n -P | grep -E "(3000|3001)"`
  - Or: `ps aux | grep "next dev"`
- Terminate the holding process gracefully:
  - `kill -TERM <PID>` then recheck; if it persists: `kill -9 <PID>`
  - If it’s in another terminal, press `Ctrl+C` in that terminal.
- If no process is running but lock remains, remove stale lock:
  - `rm -f .next/dev/lock`
  - If issues persist, clear dev artifacts: `rm -rf .next/dev && rm -rf .next/cache`
- Restart the dev server:
  - `npm run dev`
  - If port `3000` is occupied by something else, free it: `npx kill-port 3000 3001`, then retry.

## Optional Automation (after approval)
- Add a reset script to avoid stale locks before starting:
  - `"reset": "rm -f .next/dev/lock && rm -rf .next/cache"`
  - `"dev:reset": "npm run reset && next dev"`
- Optionally add `predev` to auto-clear: `"predev": "rm -f .next/dev/lock"` in `package.json`.

## Verification
- Run `npm run dev` and confirm it prints a single server URL (e.g., `http://localhost:3000`) with no lock error.
- Open the app to verify pages render.
- If it still switches ports, re-run `npx kill-port 3000` and start again.

## Notes
- The lock file at `/Users/marcosalexandre/v0-odonto-gpt-ui/.next/dev/lock` exists but is empty; its presence is enough to block a second dev instance.
- Next.js 16 uses Turbopack by default; behavior is standard for single dev instance per project.