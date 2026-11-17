type Job = {
  key: string;
  source: "wikidata" | "osm";
  query: string | null;
  kind: "station" | "line" | "stock" | "operator";
  bbox: string | null;
  lease_token: string;
};
type Item = { externalId: string; name: string; description: string; latitude: number | null; longitude: number | null };
type Entity = {
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: { id?: string; latitude?: number; longitude?: number } } } }>>;
};

function claimIds(entity: Entity, property: string) {
  return (entity.claims?.[property] ?? []).map((claim) => claim.mainsnak?.datavalue?.value?.id).filter(Boolean);
}

function matchesKind(entity: Entity, kind: Job["kind"], description: string) {
  const classes = claimIds(entity, "P31");
  if (kind === "station") return classes.some((id) => ["Q55488", "Q55485", "Q1147171"].includes(id!)) || /駅|railway station|train station/i.test(description);
  if (kind === "line") return classes.some((id) => ["Q858485", "Q728937"].includes(id!)) || /鉄道路線|railway line/i.test(description);
  if (kind === "stock") return classes.includes("Q811704") || /鉄道車両|train model/i.test(description);
  return /鉄道会社|鉄道事業者|railway company|railway operator/i.test(description);
}

async function wikidata(job: Job): Promise<Item[]> {
  if (!job.query || job.query.length > 50) throw new Error("Wikidata task has no query");
  const searchUrl = new URL("https://www.wikidata.org/w/api.php");
  Object.entries({ action: "wbsearchentities", format: "json", search: job.query, language: "ja", limit: "10", origin: "*" })
    .forEach(([key, value]) => searchUrl.searchParams.set(key, value));
  const searchResponse = await fetch(searchUrl, { signal: AbortSignal.timeout(12000) });
  if (!searchResponse.ok) throw new Error(`Wikidata HTTP ${searchResponse.status}`);
  const search = await searchResponse.json() as { search?: Array<{ id: string }> };
  const ids = (search.search ?? []).map((hit) => hit.id).filter((id) => /^Q\d+$/.test(id));
  if (!ids.length) return [];
  const detailUrl = new URL("https://www.wikidata.org/w/api.php");
  Object.entries({ action: "wbgetentities", format: "json", ids: ids.join("|"), props: "labels|descriptions|claims", languages: "ja|en", origin: "*" })
    .forEach(([key, value]) => detailUrl.searchParams.set(key, value));
  const detailResponse = await fetch(detailUrl, { signal: AbortSignal.timeout(12000) });
  if (!detailResponse.ok) throw new Error(`Wikidata detail HTTP ${detailResponse.status}`);
  const detail = await detailResponse.json() as { entities?: Record<string, Entity> };
  return ids.flatMap((id) => {
    const entity = detail.entities?.[id];
    if (!entity) return [];
    const country = claimIds(entity, "P17");
    if (country.length && !country.includes("Q17")) return [];
    const name = entity.labels?.ja?.value ?? entity.labels?.en?.value;
    const description = entity.descriptions?.ja?.value ?? entity.descriptions?.en?.value ?? "";
    if (!name || !matchesKind(entity, job.kind, description)) return [];
    const coordinate = entity.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
    return [{
      externalId: id,
      name: name.slice(0, 120),
      description: description.slice(0, 300),
      latitude: coordinate?.latitude ?? null,
      longitude: coordinate?.longitude ?? null,
    }];
  });
}

async function overpass(job: Job): Promise<Item[]> {
  const parts = (job.bbox ?? "").split(",").map(Number);
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) throw new Error("Overpass task has no bbox");
  const [south, west, north, east] = parts;
  if (south < 24 || north > 46 || west < 122 || east > 154 || north - south > 0.15 || east - west > 0.15) throw new Error("Overpass bbox out of bounds");
  const ql = `[out:json][timeout:15];nwr["railway"="station"](${south},${west},${north},${east});out center 30;`;
  const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(ql)}`, { signal: AbortSignal.timeout(18000) });
  if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
  const data = await response.json() as { elements?: Array<{ type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }> };
  return (data.elements ?? []).flatMap((element) => {
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    const name = element.tags?.["name:ja"] ?? element.tags?.name;
    if (!name || !["node", "way", "relation"].includes(element.type) || !Number.isSafeInteger(element.id) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    return [{
      externalId: `${element.type}/${element.id}`,
      name: name.slice(0, 120),
      description: (element.tags?.operator ?? "").slice(0, 300),
      latitude: latitude as number,
      longitude: longitude as number,
    }];
  });
}

export async function runCollectorOnce(): Promise<{ state: "idle" | "saved" | "error"; key?: string; count?: number; error?: string }> {
  if (!navigator.onLine) return { state: "idle" };
  const claimResponse = await fetch("/api/v1/collector/claim", { method: "POST", cache: "no-store" });
  if (!claimResponse.ok) throw new Error(`采集任务领取失败：HTTP ${claimResponse.status}`);
  const claim = await claimResponse.json() as { data: Job | null };
  const job = claim.data;
  if (!job) return { state: "idle" };
  try {
    const items = job.source === "wikidata" ? await wikidata(job) : await overpass(job);
    const complete = await fetch("/api/v1/collector/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: job.key, leaseToken: job.lease_token, status: "success", items }),
    });
    if (!complete.ok) throw new Error(`入库失败：HTTP ${complete.status}`);
    return { state: "saved", key: job.key, count: items.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知采集错误";
    await fetch("/api/v1/collector/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: job.key, leaseToken: job.lease_token, status: "error", error: message.slice(0, 150) }),
    }).catch(() => {});
    return { state: "error", key: job.key, error: message };
  }
}
