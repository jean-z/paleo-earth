// 数据下载器：从 GPlates Web Service（PALEOMAP 模型）拉取海岸线快照与城市漂移轨迹
// 用法：node tools/fetch-data.mjs（需联网；产出 public/data/*.json，之后应用完全离线可用）
import fs from 'node:fs/promises';
import { CITIES, EPOCHS } from '../src/data/cities.js';

const GWS = 'https://gws.gplates.org';
const OUT = 'public/data';

await fs.mkdir(OUT, { recursive: true });

// 1. 海岸线快照
for (const { ma } of EPOCHS) {
  const file = `${OUT}/coastlines-${ma}.json`;
  try {
    const stat = await fs.stat(file);
    if (stat.size > 100000) { console.log(`✓ coastlines-${ma}.json 已存在，跳过`); continue; }
  } catch { /* 不存在，继续下载 */ }
  process.stdout.write(`下载 ${ma} Ma 海岸线…`);
  const r = await fetch(`${GWS}/reconstruct/coastlines/?time=${ma}&model=PALEOMAP`);
  if (!r.ok) { console.log(` 失败 HTTP ${r.status}`); continue; }
  const j = await r.json();
  await fs.writeFile(file, JSON.stringify(j));
  console.log(` ✓ ${(JSON.stringify(j).length / 1024).toFixed(0)} KB`);
}

// 2. 城市漂移轨迹（每纪元单点重构，8 路并行）
const trajFile = `${OUT}/trajectories.json`;
let traj = {};
try { traj = JSON.parse(await fs.readFile(trajFile, 'utf8')); } catch { /* 首次 */ }
for (const { ma } of EPOCHS) {
  if (traj[ma] && Object.keys(traj[ma]).length >= CITIES.length) continue;
  traj[ma] = traj[ma] ?? {};
  await Promise.all(CITIES.map(async (c) => {
    if (traj[ma][c.id]) return;
    const r = await fetch(`${GWS}/reconstruct/reconstruct_points/?points=${c.lon},${c.lat}&time=${ma}&model=PALEOMAP`);
    if (!r.ok) return;
    const j = await r.json();
    if (j.coordinates?.[0]) traj[ma][c.id] = j.coordinates[0];
  }));
  console.log(`✓ 轨迹 ${ma} Ma：${Object.keys(traj[ma]).length}/${CITIES.length} 城`);
}
await fs.writeFile(trajFile, JSON.stringify(traj));
console.log('\n全部完成：public/data/');
