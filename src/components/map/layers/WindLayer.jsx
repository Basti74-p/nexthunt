import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

function getWindColor(speed) {
  if (speed < 10) return [96, 165, 250];   // blau
  if (speed < 25) return [52, 211, 153];   // grün
  if (speed < 40) return [251, 191, 36];   // gelb
  return [248, 113, 113];                   // rot
}

class WindCanvasLayer extends L.Layer {
  constructor(windDeg, windSpeed) {
    super();
    this.windDeg = windDeg;
    this.windSpeed = windSpeed;
    this._animFrame = null;
    this._canvas = null;
    this._streamlines = [];
  }

  onAdd(map) {
    this._map = map;
    this._canvas = document.createElement("canvas");
    Object.assign(this._canvas.style, {
      position: "absolute", top: "0", left: "0",
      pointerEvents: "none", zIndex: "400",
    });
    map.getPanes().overlayPane.appendChild(this._canvas);
    this._resize();
    this._initStreamlines();
    this._animate();
    map.on("moveend zoomend resize", this._onMapChange, this);
    return this;
  }

  onRemove(map) {
    cancelAnimationFrame(this._animFrame);
    if (this._canvas?.parentNode) this._canvas.parentNode.removeChild(this._canvas);
    map.off("moveend zoomend resize", this._onMapChange, this);
  }

  _onMapChange() {
    this._resize();
    this._initStreamlines();
  }

  _resize() {
    const { x, y } = this._map.getSize();
    this._canvas.width = x;
    this._canvas.height = y;
  }

  _initStreamlines() {
    const { x: w, y: h } = this._map.getSize();
    // speed in px/frame: faster wind = faster lines
    const pxSpeed = Math.max(0.8, (this.windSpeed / 3.6) * 0.5);
    // direction: windDeg is FROM, so lines move TO (downwind)
    const rad = ((this.windDeg + 180) % 360) * Math.PI / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);

    const count = 3; // nur 3 dünne Pfeile
    this._streamlines = [];

    for (let i = 0; i < count; i++) {
      this._streamlines.push(this._newLine(w, h, dx, dy, pxSpeed, true));
    }
  }

  _newLine(w, h, dx, dy, pxSpeed, random) {
    // trail is array of {x,y} points
    const trailLen = 30 + Math.floor(Math.random() * 40);
    let x, y;
    if (random) {
      x = Math.random() * w;
      y = Math.random() * h;
    } else {
      // spawn from upwind edge
      if (Math.abs(dx) >= Math.abs(dy)) {
        x = dx > 0 ? -5 : w + 5;
        y = Math.random() * h;
      } else {
        x = Math.random() * w;
        y = dy > 0 ? -5 : h + 5;
      }
    }
    const speed = pxSpeed * (0.5 + Math.random() * 1.0);
    return {
      x, y, dx, dy, speed,
      trail: Array.from({ length: trailLen }, () => ({ x, y })),
      trailLen,
      age: Math.floor(Math.random() * trailLen), // stagger start
      maxAge: 120 + Math.floor(Math.random() * 100),
    };
  }

  _animate() {
    const { x: w, y: h } = this._map.getSize();
    const ctx = this._canvas.getContext("2d");
    const [r, g, b] = getWindColor(this.windSpeed);
    const rad = ((this.windDeg + 180) % 360) * Math.PI / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const pxSpeed = Math.max(0.8, (this.windSpeed / 3.6) * 0.5);

    // Clear frame completely — trails are drawn per-segment with alpha
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < this._streamlines.length; i++) {
      const s = this._streamlines[i];
      s.age++;

      // Advance head position
      s.x += s.dx * s.speed;
      s.y += s.dy * s.speed;

      // Push new head into trail, drop tail
      s.trail.unshift({ x: s.x, y: s.y });
      if (s.trail.length > s.trailLen) s.trail.pop();

      // Draw trail as a gradient line
      const trail = s.trail;
      if (trail.length < 2) continue;

      for (let t = 0; t < trail.length - 1; t++) {
        const alpha = ((trail.length - t) / trail.length) * 0.35;
        ctx.beginPath();
        ctx.moveTo(trail[t].x, trail[t].y);
        ctx.lineTo(trail[t + 1].x, trail[t + 1].y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // Reset when out of bounds or old
      const outOfBounds = s.x < -60 || s.x > w + 60 || s.y < -60 || s.y > h + 60;
      if (outOfBounds || s.age > s.maxAge) {
        this._streamlines[i] = this._newLine(w, h, dx, dy, pxSpeed, false);
      }
    }

    this._animFrame = requestAnimationFrame(() => this._animate());
  }
}

export default function WindLayer({ windDeg, windSpeed }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (windDeg == null) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    const layer = new WindCanvasLayer(windDeg, windSpeed);
    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [windDeg, windSpeed, map]);

  return null;
}