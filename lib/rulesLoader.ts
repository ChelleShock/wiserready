// rulesLoader.ts
import fs from "node:fs/promises";
import path from "node:path";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

type ArticleRef = {
  article_id: string;
  article_title: string;
  mac_carrier: string;
  state: string;
  cms_article_url: string;
  last_updated: string;
};

export type GroupedByCpt = {
  cpt: string;
  articles: ArticleRef[];
  requires_pa: boolean;
  programs: string[];
};

let _cache: { ts: number; grouped: GroupedByCpt[] } | null = null;
const TTL_MS = 60_000; // 60s

async function readJsonLocal<T>(p: string): Promise<T> {
  const abs = path.resolve(process.cwd(), p);
  try {
    const buf = await fs.readFile(abs, "utf-8");
    return JSON.parse(buf) as T;
  } catch (err: any) {
    const msg = `Failed to read local JSON at ${abs}: ${err?.message || err}`;
    throw new Error(msg);
  }
}

async function fetchJsonRemote<T>(url: string): Promise<T> {
  try {
    // Basic sanity check: ensure valid http(s) scheme
    if (!/^https?:\/\//i.test(url)) {
      throw new Error(`Not an HTTP(S) URL: ${url}`);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000); // 15s
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text.slice(0, 200)}` : ""}`);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    throw new Error(`Failed to fetch remote JSON at ${url}: ${err?.message || err}`);
  }
}

// --- NEW: read from S3 using SDK (supports ARN or s3:// URL) ---
function parseS3Ref(input: string): { bucket: string; key: string } {
  // s3://bucket/key...
  const s3UrlMatch = input.match(/^s3:\/\/([^/]+)\/(.+)$/i);
  if (s3UrlMatch) return { bucket: s3UrlMatch[1], key: s3UrlMatch[2] };

  // arn:aws:s3:::bucket/key...
  const arnMatch = input.match(/^arn:aws:s3:::([^/]+)\/(.+)$/i);
  if (arnMatch) return { bucket: arnMatch[1], key: arnMatch[2] };

  throw new Error(`Unrecognized S3 reference: ${input}`);
}

async function readJsonFromS3<T>(ref: string, region = process.env.AWS_REGION || "us-east-1"): Promise<T> {
  const { bucket, key } = parseS3Ref(ref);
  const s3 = new S3Client({ region });
  try {
    const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!Body) throw new Error("Empty S3 body");
    const chunks: Buffer[] = [];
    for await (const chunk of Body as any) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const text = Buffer.concat(chunks).toString("utf-8");
    return JSON.parse(text) as T;
  } catch (err: any) {
    throw new Error(`Failed to read S3 object s3://${bucket}/${key}: ${err?.message || err}`);
  }
}

export async function loadGrouped(): Promise<GroupedByCpt[]> {
  const now = Date.now();
  if (_cache && now - _cache.ts < TTL_MS) return _cache.grouped;

  // Priority:
  // 1) RULES_GROUPED_URL (http/https or s3://)
  // 2) RULES_GROUPED_S3_ARN (arn:aws:s3:::bucket/key)
  // 3) RULES_GROUPED_PATH (local file path)
  // 4) default local path
  const urlOrS3 = process.env.RULES_GROUPED_URL?.trim();
  const s3Arn = process.env.RULES_GROUPED_S3_ARN?.trim();
  const localPath = process.env.RULES_GROUPED_PATH || "./data/cms/rules_grouped_by_cpt.json";

  let grouped: GroupedByCpt[];

  try {
    if (urlOrS3) {
      if (/^https?:\/\//i.test(urlOrS3)) {
        grouped = await fetchJsonRemote<GroupedByCpt[]>(urlOrS3);
      } else if (/^(s3:\/\/|arn:aws:s3:::)/i.test(urlOrS3)) {
        grouped = await readJsonFromS3<GroupedByCpt[]>(urlOrS3);
      } else {
        // Treat anything else as a local path (useful for dev)
        grouped = await readJsonLocal<GroupedByCpt[]>(urlOrS3);
      }
    } else if (s3Arn) {
      grouped = await readJsonFromS3<GroupedByCpt[]>(s3Arn);
    } else {
      grouped = await readJsonLocal<GroupedByCpt[]>(localPath);
    }

    _cache = { ts: now, grouped };
    return grouped;
  } catch (err: any) {
    throw new Error(`Failed to load grouped rules: ${err?.message || err}`);
  }
}

export function invalidateRulesCache() {
  _cache = null;
}
