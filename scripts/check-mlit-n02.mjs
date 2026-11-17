import { load } from "cheerio";
import { pathToFileURL } from "node:url";

const entry = "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2025.html";
const allowedHost = "nlftp.mlit.go.jp";
const agent = "ChaseTheTrain/0.1 (https://github.com/albertjiayou0423/chase-the-train)";

async function getPage(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, {
      headers: { "User-Agent": agent, Accept: "text/html" },
      signal: AbortSignal.timeout(12000),
    });
    if (response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html")) throw new Error("MLIT returned an unexpected content type");
      const html = await response.text();
      if (html.length > 2_000_000) throw new Error("MLIT page is too large");
      return html;
    }
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) throw new Error(`MLIT HTTP ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
  }
  throw new Error("MLIT did not respond");
}

function approvedUrl(path, base) {
  const url = new URL(path, base);
  if (url.protocol !== "https:" || url.hostname !== allowedHost) throw new Error("Unexpected MLIT download host");
  return url.href;
}

export function parseN02Page(html, pageUrl) {
  const $ = load(html);
  const releases = [];
  $("tr").each((_, row) => {
    const cells = $(row).find("td");
    const filename = $(cells[4]).text().trim();
    const match = /^N02-(\d{2})_GML\.zip$/.exec(filename);
    if (!match) return;
    const action = $(row).find("[onclick*='DownLd']").attr("onclick") ?? "";
    const pathMatch = /['"]([^'"]*\/data\/N02\/N02-\d{2}\/N02-\d{2}_GML\.zip)['"]/.exec(action);
    if (!pathMatch) throw new Error(`Download link missing for ${filename}`);
    const year = 2000 + Number(match[1]);
    releases.push({
      year,
      filename,
      sizeLabel: $(cells[3]).text().trim(),
      url: approvedUrl(pathMatch[1], pageUrl),
    });
  });
  if (!releases.length) throw new Error("No N02 release rows found; page layout may have changed");
  releases.sort((a, b) => b.year - a.year);
  return releases;
}

export async function checkN02() {
  const indexHtml = await getPage(entry);
  const $ = load(indexHtml);
  const candidates = $(indexHtml)
    .find('a[href*="KsjTmplt-N02-"]')
    .toArray()
    .map((element) => $(element).attr("href"))
    .filter(Boolean)
    .map((href) => approvedUrl(href, entry))
    .filter((url) => /KsjTmplt-N02-20\d{2}\.html$/.test(url));
  const pages = [...new Set([entry, ...candidates])];
  pages.sort((a, b) => Number(b.match(/N02-(20\d{2})\.html/)?.[1] ?? 0) - Number(a.match(/N02-(20\d{2})\.html/)?.[1] ?? 0));
  const pageUrl = pages[0];
  const html = pageUrl === entry ? indexHtml : await getPage(pageUrl);
  const releases = parseN02Page(html, pageUrl);
  return {
    source: "MLIT National Land Numerical Information N02",
    pageUrl,
    termsUrl: "https://nlftp.mlit.go.jp/ksj/other/agreement.html",
    checkedAt: new Date().toISOString(),
    latest: releases[0],
    availableYears: releases.map((release) => release.year),
    note: "Metadata discovery only; no dataset is downloaded or imported.",
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await checkN02(), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
