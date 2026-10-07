// 预置城市列表（家乡标记用）——坐标为现代经纬度
export const CITIES = [
  { id: 'ningbo', zh: '宁波', lon: 121.55, lat: 29.87 },
  { id: 'beijing', zh: '北京', lon: 116.407, lat: 39.904 },
  { id: 'shanghai', zh: '上海', lon: 121.473, lat: 31.23 },
  { id: 'guangzhou', zh: '广州', lon: 113.264, lat: 23.129 },
  { id: 'shenzhen', zh: '深圳', lon: 114.058, lat: 22.543 },
  { id: 'chengdu', zh: '成都', lon: 104.066, lat: 30.572 },
  { id: 'xian', zh: '西安', lon: 108.94, lat: 34.341 },
  { id: 'urumqi', zh: '乌鲁木齐', lon: 87.617, lat: 43.826 },
  { id: 'lhasa', zh: '拉萨', lon: 91.114, lat: 29.646 },
  { id: 'harbin', zh: '哈尔滨', lon: 126.642, lat: 45.756 },
  { id: 'wuhan', zh: '武汉', lon: 114.305, lat: 30.592 },
  { id: 'kunming', zh: '昆明', lon: 102.832, lat: 25.04 },
  { id: 'hongkong', zh: '香港', lon: 114.169, lat: 22.319 },
];

/** 地质年代快照（Ma = 百万年前）与对应地质时期 */
export const EPOCHS = [
  { ma: 540, era: '寒武纪', note: '寒武纪大爆发前夕，大陆分散' },
  { ma: 450, era: '奥陶纪', note: '海侵广泛，生命向陆地进军前夜' },
  { ma: 360, era: '泥盆纪末', note: '鱼类时代，森林首次出现' },
  { ma: 300, era: '石炭纪末', note: '盘古大陆聚合中，成煤盛世' },
  { ma: 250, era: '二叠纪末', note: '盘古大陆鼎盛 · 史上最大灭绝' },
  { ma: 200, era: '三叠纪末', note: '盘古大陆开始裂解，恐龙崛起' },
  { ma: 145, era: '白垩纪初', note: '大西洋张开，恐龙盛世' },
  { ma: 90,  era: '白垩纪中期', note: '温室地球，海平面最高' },
  { ma: 50,  era: '始新世', note: '印度撞向亚洲，青藏高原隆升中' },
  { ma: 15,  era: '中新世', note: '接近现代格局' },
  { ma: 0,   era: '今天', note: '板块仍在移动' },
];
