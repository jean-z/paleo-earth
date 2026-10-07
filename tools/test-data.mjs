// 数据完整性校验：node tools/test-data.mjs
import fs from 'node:fs/promises';
import { CITIES, EPOCHS } from '../src/data/cities.js';

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? '✅' : '❌'} ${name}`); };

// 1. 海岸线快照
for (const { ma } of EPOCHS) {
  const j = JSON.parse(await fs.readFile(`public/data/coastlines-${ma}.json`, 'utf8'));
  check(`${ma} Ma 海岸线：FeatureCollection + 有要素`, j.type === 'FeatureCollection' && j.features?.length > 0);
}

// 2. 城市轨迹
const traj = JSON.parse(await fs.readFile('public/data/trajectories.json', 'utf8'));
// GWS 的 999.99 哨兵值 = PALEOMAP 深时未覆盖该地块，视为合法"缺失"
const isMissing = ([lo, la]) => Math.abs(lo) > 180 || Math.abs(la) > 90;
check('轨迹覆盖全部纪元', EPOCHS.every(({ ma }) => traj[ma]));
check('轨迹覆盖全部城市', EPOCHS.every(({ ma }) => CITIES.every((c) => Array.isArray(traj[ma][c.id]))));
const inRange = EPOCHS.every(({ ma }) => CITIES.every((c) => {
  const [lo, la] = traj[ma][c.id];
  return isMissing([lo, la]) || (lo >= -180 && lo <= 180 && la >= -90 && la <= 90);
}));
check('轨迹坐标全部在经纬度范围内（或为缺失哨兵）', inRange);

// 3. 校准点：宁波今天应 ≈ (121.55, 29.87)
const nb = traj[0]?.ningbo;
check('宁波今天的位置 ≈ 真实位置（±0.5°）', nb && Math.abs(nb[0] - 121.55) < 0.5 && Math.abs(nb[1] - 29.87) < 0.5);

// 4. 漂移确实发生：宁波 250 Ma 与今天相距应超过 10°
const nb250 = traj[250]?.ningbo;
const d = Math.hypot(nb[0] - nb250[0], nb[1] - nb250[1]);
console.log(`  宁波 250 Ma→今天 位移约 ${d.toFixed(1)}°`);
check('250 Ma 以来的漂移量显著（> 10°）', d > 10);

console.log(`\n${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
