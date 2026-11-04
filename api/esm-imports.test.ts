import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Vercel runs api/ as native ES modules: relative imports MUST end in ".js" or the function fails to start
// (FUNCTION_INVOCATION_FAILED in production). Tests use Vite's resolver, which hides the problem, hence this check.
describe("server code is loadable as native ESM", () => {
  for (const dir of ["api", "emails", "src/engine"]) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".ts") && !x.endsWith(".test.ts"))) {
      it(`${dir}/${f} uses explicit .js extensions in relative imports`, () => {
        const src = readFileSync(`${dir}/${f}`, "utf8");
        const bad = [...src.matchAll(/from\s+"(\.{1,2}\/[^"]+)"/g)].map((m) => m[1]).filter((p) => !/\.(js|json|mjs)$/.test(p));
        expect(bad).toEqual([]);
      });
    }
  }
});
