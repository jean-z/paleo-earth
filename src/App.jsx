import { useEffect, useMemo, useRef, useState } from 'react'
import GlobeCanvas from './components/GlobeCanvas.jsx'
import { CITIES, EPOCHS } from './data/cities.js'

export default function App() {
  const globeRef = useRef(null)
  const cache = useRef(new Map())                 // 纪元海岸线缓存
  const [epochIdx, setEpochIdx] = useState(EPOCHS.length - 1)   // 默认今天
  const [cityId, setCityId] = useState('ningbo')
  const [traj, setTraj] = useState(null)          // 城市漂移轨迹 {ma: [lon,lat]}
  const [playing, setPlaying] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const epoch = EPOCHS[epochIdx]
  const city = CITIES.find((c) => c.id === cityId)
  const eraText = epoch.ma === 0 ? '今天' : `${epoch.era} · ${epoch.ma} Ma`

  /* 载入城市漂移轨迹 */
  useEffect(() => {
    fetch('/data/trajectories.json').then((r) => r.json()).then(setTraj).catch(() => {})
  }, [])

  /* 纪元切换：按需加载海岸线 */
  useEffect(() => {
    const T = epoch.ma
    const cached = cache.current.get(T)
    if (cached) { globeRef.current?.setEpoch(cached, eraText); return }
    setLoaded(false)
    fetch(`/data/coastlines-${T}.json`)
      .then((r) => r.json())
      .then((j) => { cache.current.set(T, j); setLoaded(true); globeRef.current?.setEpoch(j, eraText) })
      .catch(() => setLoaded(true))
  }, [epochIdx])

  /* 城市/纪元变化 → 更新轨迹标记（PALEOMAP 深时无覆盖的位置标记为 null） */
  useEffect(() => {
    if (!traj) return
    const inRange = (c) => Array.isArray(c) && Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90
    const pts = EPOCHS.map(({ ma }) => {
      const c = traj[ma]?.[cityId]
      return inRange(c) ? c : null
    })
    globeRef.current?.setCity(pts, epochIdx, city?.zh ?? '', eraText)
  }, [traj, cityId, epochIdx, loaded])

  /* 播放：自动沿时间前进（今天 → 过去 → 循环） */
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setEpochIdx((i) => (i - 1 + EPOCHS.length) % EPOCHS.length)
    }, 900)
    return () => clearInterval(id)
  }, [playing])

  const cityPoint = traj?.[epoch.ma]?.[cityId]
  const validPoint = Array.isArray(cityPoint) && Math.abs(cityPoint[0]) <= 180 && Math.abs(cityPoint[1]) <= 90
  const paleoLat = validPoint ? cityPoint[1] : null
  const zone = paleoLat == null ? '' : (() => {
    const a = Math.abs(paleoLat)
    if (a < 23.5) return '热带'
    if (a < 66.5) return paleoLat > 0 ? '北温带' : '南温带'
    return paleoLat > 0 ? '北极圈' : '南极圈'
  })()

  return (
    <div id="app">
      <GlobeCanvas ref={globeRef} />

      <header>
        <h1>🧭 古地球</h1>
        <p className="sub">大陆漂移 5.4 亿年 · GPlates / PALEOMAP</p>
      </header>

      <aside id="panel">
        <div className="era-block">
          <div className="era-ma">{epoch.ma === 0 ? '现在' : `${epoch.ma} 百万年前`}</div>
          <div className="era-name">{epoch.era}</div>
          <div className="era-note">{epoch.note}</div>
        </div>

        <div className="city-block">
          <label className="k" htmlFor="city">我的家乡</label>
          <select id="city" value={cityId} onChange={(e) => setCityId(e.target.value)}>
            {CITIES.map((c) => <option key={c.id} value={c.id}>{c.zh}</option>)}
          </select>
          {paleoLat != null ? (
            <div className="paleo-info">
              <div className="paleo-lat">{paleoLat >= 0 ? '+' : ''}{paleoLat.toFixed(1)}°</div>
              <div className="paleo-desc">
                {city.zh}当时位于 <b>{zone}</b>
                （今 {city.lat.toFixed(1)}°N → 古纬度 {Math.abs(paleoLat).toFixed(1)}°{paleoLat >= 0 ? 'N' : 'S'}）
              </div>
            </div>
          ) : (
            <p className="paleo-loading">
              {cityPoint ? '轨迹数据加载中…' : `PALEOMAP 模型在此时期未覆盖${city.zh}所在的地块`}
            </p>
          )}
        </div>

        <div className="time-block">
          <button className="ctl" onClick={() => setPlaying((p) => !p)}>{playing ? '⏸ 暂停' : '▶ 播放漂移'}</button>
          <input
            id="time" type="range" min="0" max={EPOCHS.length - 1} step="1"
            value={EPOCHS.length - 1 - epochIdx}
            onChange={(e) => setEpochIdx(EPOCHS.length - 1 - Number(e.target.value))}
          />
          <div className="time-scale"><span>540 Ma</span><span>今天</span></div>
        </div>
      </aside>

      <footer>数据：GPlates Web Service · PALEOMAP 模型（Scotese）· 教育演示用途</footer>
    </div>
  )
}
