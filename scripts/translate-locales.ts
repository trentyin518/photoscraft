/** Translate messages/en.json -> ru, ja, ko via DeepSeek, preserving placeholders. */
import fs from 'node:fs';

const API_KEY = process.env.DEEPSEEK_API_KEY || '';
if (!API_KEY) throw new Error('Missing DEEPSEEK_API_KEY');
const MODEL = 'deepseek-chat';
const TARGETS: Record<string, string> = {
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
};

type Obj = Record<string, any>;
const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

function collectPaths(en: any, cur: any, prefix: string, out: { path: string; text: string }[]) {
  if (typeof en === 'string') {
    if (typeof cur !== 'string' || cur === en) out.push({ path: prefix, text: en });
    return;
  }
  if (Array.isArray(en)) {
    en.forEach((v, i) => collectPaths(v, Array.isArray(cur) ? cur[i] : undefined, `${prefix}[${i}]`, out));
    return;
  }
  if (isObj(en)) {
    for (const k of Object.keys(en)) {
      collectPaths(en[k], isObj(cur) ? cur[k] : undefined, prefix ? `${prefix}.${k}` : k, out);
    }
  }
}

function setPath(obj: any, path: string, value: string) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] === undefined) cur[p] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

async function translateBatch(lang: string, items: { path: string; text: string }[]): Promise<string[]> {
  const numbered = items.map((it, i) => `${i}|||${it.text}`).join('\n');
  const body = {
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `Translate each line's text after "|||" from English to ${TARGETS[lang]}. Rules: 1) Output ONLY lines in the same format "INDEX|||translation", one per line, same order and count. 2) NEVER translate placeholders like {count}, {name}, {locale}, HTML tags, URLs, emails, or brand names (PhotoCraft, Google, GitHub, Stripe). Keep them exactly. 3) Keep tone natural for a SaaS photo editor UI.`,
      },
      { role: 'user', content: numbered },
    ],
    temperature: 0.2,
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`HTTP ${res.status}, retry ${attempt + 1}`);
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }
    const data = (await res.json()) as any;
    const text: string = data.choices?.[0]?.message?.content ?? '';
    const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const out: string[] = new Array(items.length);
    for (const l of lines) {
      const m = l.match(/^(\d+)\|\|\|(.*)$/);
      if (m) out[Number(m[1])] = m[2];
    }
    if (out.every((v) => typeof v === 'string')) return out;
    console.error('Parse failed, retry', attempt + 1, text.slice(0, 200));
  }
  throw new Error(`translate failed for batch starting ${items[0]?.path}`);
}

async function main() {
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
for (const lang of Object.keys(TARGETS)) {
  const cur: Obj = JSON.parse(fs.readFileSync(`messages/${lang}.json`, 'utf8'));
  // add missing top-level keys from en first
  for (const k of Object.keys(en)) if (cur[k] === undefined) cur[k] = en[k];

  const jobs: { path: string; text: string }[] = [];
  collectPaths(en, cur, '', jobs);
  console.log(`${lang}: ${jobs.length} strings need translation`);

  const BATCH = 80;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const batch = jobs.slice(i, i + BATCH);
    const results = await translateBatch(lang, batch);
    batch.forEach((job, j) => setPath(cur, job.path, results[j]));
    console.log(`${lang}: ${Math.min(i + BATCH, jobs.length)}/${jobs.length}`);
  }
  fs.writeFileSync(`messages/${lang}.json`, JSON.stringify(cur, null, 2) + '\n');
  console.log(`${lang}: done`);
}
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
