// Tells Bing, Yandex, Seznam, Naver... (IndexNow) that our pages exist or changed, so they crawl them now.
// Usage: node scripts/indexnow.mjs [https://cuotio.es]   (reads the live sitemap.xml)
// The key file public/<key>.txt must be deployed first: it proves we own the site.
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const site = (process.argv[2] || "https://cuotio.es").replace(/\/$/, "");
const pub = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const key = readdirSync(pub).find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.slice(0, -4);
if (!key) throw new Error("No IndexNow key file in public/");

const xml = await (await fetch(`${site}/sitemap.xml`)).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList }),
});
console.log(`IndexNow: ${urlList.length} URLs -> HTTP ${res.status} ${res.status === 200 || res.status === 202 ? "(aceptado)" : await res.text()}`);
