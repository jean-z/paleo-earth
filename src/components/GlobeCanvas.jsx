import { useEffect, useImperativeHandle, useRef } from 'react'

const D2R = Math.PI / 180;

/**
 * 古地球渲染器：正交投影 2D Canvas（与风之镜同源投影）
 * 三层数据：海岸线 GeoJSON（按纪元整体替换）+ 城市漂移轨迹 + 当前标记
 * 无动画帧循环——只在数据/视角变化时重绘，后台标签页零开销
 */
export default function GlobeCanvas({ ref }) {
  const baseRef = useRef(null);
  const s = useRef(null);

  useEffect(() => {
    const canvas = baseRef.current;
    const ctx = canvas.getContext('2d');
    const st = {
      ctx, canvas, w: 0, h: 0, cx: 0, cy: 0, R: 100,
      lon0: 105, lat0: 20, scale: 1,
      geo: null, trajPts: null, marker: null, label: '',
    };

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = window.innerWidth, h = window.innerHeight;
      const mobile = w <= 720;
      st.w = w; st.h = h;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      st.cx = w / 2;
      // 移动端：底部抽屉占据下方约 38%，地球重心上移
      st.cy = h * (mobile ? 0.40 : 0.5);
      st.R = Math.min(w, h) * (mobile ? 0.42 : 0.44) * st.scale;
      redraw();
    };
    window.addEventListener('resize', resize);

    // 交互：拖拽旋转 / 滚轮缩放
    let dragging = false, lx = 0, ly = 0;
    const down = (e) => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); };
    const move = (e) => {
      if (!dragging) return;
      st.lon0 -= (e.clientX - lx) * 0.24;
      st.lat0 = Math.max(-85, Math.min(85, st.lat0 + (e.clientY - ly) * 0.24));
      lx = e.clientX; ly = e.clientY;
      redraw();
    };
    const up = () => { dragging = false; };
    const wheel = (e) => {
      e.preventDefault();
      st.scale = Math.max(0.6, Math.min(5, st.scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
      st.R = Math.min(st.w, st.h) * 0.44 * st.scale;
      redraw();
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', wheel, { passive: false });

    function project(lon, lat) {
      const l = (lon - st.lon0) * D2R, p = lat * D2R, p0 = st.lat0 * D2R;
      const cosc = Math.cos(p) * Math.cos(l);
      if (cosc < 0) return null;
      return {
        x: st.cx + st.R * Math.cos(p) * Math.sin(l),
        y: st.cy - st.R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)),
      };
    }

    function drawSphere() {
      const { ctx, cx, cy, R } = st;
      const rg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
      rg.addColorStop(0, '#123a5e');
      rg.addColorStop(1, '#030c18');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = rg; ctx.fill();
      ctx.strokeStyle = 'rgba(140,220,255,.45)'; ctx.lineWidth = 1.4;
      ctx.shadowColor = 'rgba(120,210,255,.5)'; ctx.shadowBlur = 24;
      ctx.stroke(); ctx.shadowBlur = 0;
      // 经纬网
      ctx.strokeStyle = 'rgba(160,205,226,.10)'; ctx.lineWidth = 1;
      const line = (pts) => {
        ctx.beginPath(); let pen = false;
        for (const [lo, la] of pts) {
          const s2 = project(lo, la);
          if (!s2) { pen = false; continue; }
          pen ? ctx.lineTo(s2.x, s2.y) : ctx.moveTo(s2.x, s2.y);
          pen = true;
        }
        ctx.stroke();
      };
      const samp = (fn) => { const a = []; for (let t = -180; t <= 180; t += 3) a.push(fn(t)); return a; };
      for (let lon = -180; lon < 180; lon += 30) line(samp((t) => [lon, t]));
      for (const lat of [-45, 0, 45]) line(samp((t) => [t, lat]));
    }

    function drawLand() {
      const { ctx, geo } = st;
      if (!geo?.features) return;
      ctx.lineJoin = 'round';
      for (const f of geo.features) {
        const gm = f.geometry;
        if (!gm) continue;
        const polys = gm.type === 'Polygon' ? [gm.coordinates] : gm.type === 'MultiPolygon' ? gm.coordinates : [];
        for (const poly of polys) {
          for (const ring of poly) {
            const proj = ring.map(([lo, la]) => project(lo, la));
            const allVisible = proj.every(Boolean);
            ctx.beginPath();
            let pen = false, started = false;
            for (const p of proj) {
              if (!p) { pen = false; continue; }
              started = true;
              pen ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), pen = true);
            }
            if (!started) continue;
            if (allVisible) { ctx.fillStyle = '#3d7a54'; ctx.fill(); }
            ctx.strokeStyle = 'rgba(200,235,255,.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    function drawTrajectory() {
      const { ctx, trajPts } = st;
      if (!trajPts?.length) return;
      // 轨迹连线（金色）
      ctx.strokeStyle = 'rgba(255,210,122,.75)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      let pen = false;
      for (const p of trajPts) {
        const s2 = project(p.lon, p.lat);
        if (!s2) { pen = false; continue; }
        pen ? ctx.lineTo(s2.x, s2.y) : ctx.moveTo(s2.x, s2.y);
        pen = true;
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // 各纪元小点
      for (const p of trajPts) {
        const s2 = project(p.lon, p.lat);
        if (!s2) continue;
        ctx.beginPath(); ctx.arc(s2.x, s2.y, 2.2, 0, 7);
        ctx.fillStyle = 'rgba(255,210,122,.9)'; ctx.fill();
      }
      // 当前纪元标记
      const cur = trajPts[st.marker?.idx];
      if (cur) {
        const s2 = project(cur.lon, cur.lat);
        if (s2) {
          const pulse = 6 + 2.5 * Math.abs(Math.sin(performance.now() / 400));
          ctx.beginPath(); ctx.arc(s2.x, s2.y, 4, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
          ctx.beginPath(); ctx.arc(s2.x, s2.y, pulse, 0, 7);
          ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.2; ctx.stroke();
          if (st.marker?.label) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px -apple-system, "PingFang SC", sans-serif';
            ctx.fillText(st.marker.label, s2.x + 9, s2.y - 8);
          }
        }
      }
    }

    function redraw() {
      const { ctx, w, h } = st;
      ctx.clearRect(0, 0, w, h);
      drawSphere();
      drawLand();
      drawTrajectory();
    }

    st.redraw = redraw;
    st.project = project;
    s.current = st;

    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  useImperativeHandle(ref, () => ({
    /** 更新海岸线（某纪元 GeoJSON）并刷新标记标签 */
    setEpoch(geo, eraText) {
      const st = s.current;
      st.geo = geo;
      if (st.marker) st.marker.label = `${eraText} · ${st.marker.cityZh ?? ''}`;
      st.redraw();
    },
    /** 设置城市漂移轨迹与当前标记（null = 该纪元无数据） */
    setCity(traj, idx, cityZh, eraText) {
      const st = s.current;
      st.trajPts = (traj ?? []).map((p) => (Array.isArray(p) ? { lon: p[0], lat: p[1] } : null));
      st.marker = { idx, cityZh, label: `${eraText} · ${cityZh}` };
      st.redraw();
    },
    setEpochIdx(idx, eraText) {
      const st = s.current;
      if (st.marker) { st.marker.idx = idx; st.marker.label = `${eraText} · ${st.marker.cityZh}`; }
      st.redraw();
    },
    rotateTo(lon, lat) { s.current.lon0 = lon; s.current.lat0 = lat; s.current.redraw(); },
  }));

  return <canvas id="paleo-globe" ref={baseRef} />;
}
