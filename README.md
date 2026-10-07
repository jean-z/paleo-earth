# 古地球 · 大陆漂移 5.4 亿年

拖动时间轴，看大陆从寒武纪漂到今天；选择家乡，看它 5.4 亿年来漂过的完整轨迹。
数据来自 **GPlates Web Service（PALEOMAP 模型，Scotese）**——真实板块重构，非手绘示意。

"太空科普系列"第六弹（完结篇）：
遨游太阳系 → 潜入深渊 → 日月食模拟器 → 风之镜 → 今晚观星 → **古地球**。

## 运行

```bash
npm install --registry=https://registry.npmmirror.com
npm run fetch    # 首次：从 GPlates Web Service 下载 11 个纪元的海岸线与城市轨迹（~10MB，之后离线可用）
npm run dev      # → http://localhost:5178
npm test         # 数据完整性校验（Node 直接跑）
```

## 功能

- **11 个地质纪元快照**（540 → 0 Ma）：寒武纪 → 奥陶纪 → 泥盆纪 → 石炭纪 →
  二叠纪（盘古大陆鼎盛）→ 三叠纪（裂解开始）→ 白垩纪 → 始新世 → 今天
- **家乡漂移轨迹**：内置 13 个城市（宁波/北京/上海/广州/成都/乌鲁木齐/拉萨…），
  金色虚线画出它在每个纪元的位置，当前纪元呼吸圈标记
- **古纬度读数**：如宁波今天 29.9°N，2 亿年前位于古纬度 40.5°N（北温带）
- **播放漂移**：一键从今天回放至寒武纪
- 拖拽旋转 / 滚轮缩放；PALEOMAP 未覆盖的位置（如深时的乌鲁木齐地块）自动标注"数据缺失"

## 数据

- 来源：`gws.gplates.org`（GPlates Web Service，PALEOMAP Project, C.R. Scotese）
- 快照：11 个纪元 × 海岸线 GeoJSON（约 10MB，`npm run fetch` 生成于 `public/data/`）
- 城市轨迹：GWS `reconstruct_points` 端点逐点重构；`999.99` 哨兵值按"无数据"处理
- 增加更多纪元/城市：改 `src/data/cities.js` 后重跑 `npm run fetch`

## 架构

```
src/
  data/cities.js          # 城市 + 纪元配置
  components/GlobeCanvas.jsx  # 正交投影渲染器（无 rAF，仅数据/视角变化时重绘）
  App.jsx                 # 时间轴 + 纪元按需加载 + 计算管线
public/data/              # 下载的海岸线与轨迹（进入 git）
tools/fetch-data.mjs      # 数据下载器
tools/test-data.mjs       # 数据完整性校验
```

## 精度声明

PALEOMAP 是学界主流重构模型之一，但深时（>3 亿年）的大陆位置仍存在
模型间差异；本应用为教育演示用途，不做科研引用。
