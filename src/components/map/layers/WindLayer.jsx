import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

function getWindColor(speed) {
  if (speed < 10) return "rgba(96,165,250,0.7)";   // blau
  if (speed < 25) return "rgba(52,211,153,0.75)";   // grün
  if (speed < 40) return "rgba(251,191,36,0.8)";    // gelb
  return "rgba(248,113,113,0.85)";                   // rot
}

class WindCanvasLayer extends L.Layer {
  constructor(windDeg, windSpeed) {
    super();
    this.windDeg = windDeg;
    this.windSpeed = windSpeed;
    this._animFrame = null;
    this._canvas = null;
    this._particles = [];
    this._startTime = null;
  }

  onAdd(map) {
    this._map = map;
    this._canvas = document.createElement("canvas");
    this._canvas.style.position = "absolute";
    this._canvas.style.top = "0";
    this._canvas.style.left = "0";
    this._canvas.style.pointerEvents = "none";
    this._canvas.style.zIndex = "400";
    this._canvas.style.opacity = "0.85";

    map.getPanes().overlayPane.appendChild(this._canvas);
    this._resize();
    this._initParticles();
    this._startTime = performance.now();
    this._animate();

    map.on("moveend zoomend resize", this._onMapChange, this);
    return this;
  }

  onRemove(map) {
    cancelAnimationFrame(this._animFrame);
    if (this._canvas && this._canvas.parentNode) {
      this._canvas.parentNode.removeChild(this._canvas);
    }
    map.off("moveend zoomend resize", this._onMapChange, this);
  }

  _onMapChange() {
    this._resize();
    this._initParticles();
  }

  _resize() {
    const size = this._map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;
  }

  _initParticles() {
    const size = this._map.getSize();
    const w = size.x;
    const h = size.y;
    const count = Math.floor((w * h) / 8000); // density
    this._particles = [];
    for (let i = 0; i < count; i++) {
      this._particles.push(this._newParticle(w, h, true));
    }
  }

  _newParticle(w, h, randomStart) {
    // spawn particles from the upwind edge
    const rad = ((this.windDeg - 180 + 360) % 360) * Math.PI / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const speed = (this.windSpeed / 3.6) * 0.4 + 0.5; // px/frame scale

    let x, y;
    if (randomStart) {
      x = Math.random() * w;
      y = Math.random() * h;
    } else {
      // Start from upwind edge
      if (Math.abs(dx) > Math.abs(dy)) {
        x = dx > 0 ? 0 : w;
        y = Math.random() * h;
      } else {
        x = Math.random() * w;
        y = dy > 0 ? 0 : h;
      }
    }

    return {
      x, y, dx, dy,
      speed: speed * (0.6 + Math.random() * 0.8),
      life: 0,
      maxLife: 80 + Math.random() * 120,
      size: 1.5 + Math.random() * 2,
      offset: Math.random() * Math.PI * 2,
    };
  }

  _animate() {
    const size = this._map.getSize();
    const w = size.x;
    const h = size.y;
    const ctx = this._canvas.getContext("2d");
    const color = getWindColor(this.windSpeed);
    const now = performance.now();

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < this._particles.length; i++) {
      const p = this._particles[i];
      p.x += p.dx * p.speed;
      p.y += p.dy * p.speed;
      p.life++;

      // slight wobble perpendicular to wind
      const wobble = Math.sin(now * 0.002 + p.offset) * 0.4;
      const rx = p.x + (-p.dy) * wobble;
      const ry = p.y + p.dx * wobble;

      const alpha = Math.min(1, p.life / 15) * Math.max(0, 1 - (p.life - p.maxLife * 0.7) / (p.maxLife * 0.3));

      ctx.beginPath();
      ctx.arc(rx, ry, p.size, 0, Math.PI * 2);
      ctx.fillStyle = color.replace(")", `,${alpha})`).replace("rgba(", "rgba(");
      ctx.fill();

      // Reset when out of bounds or expired
      if (p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20 || p.life > p.maxLife) {
        this._particles[i] = this._newParticle(w, h, false);
      }
    }

    // Draw sparse arrow indicators every ~120px
    const step = 120;
    const rad = ((this.windDeg - 180 + 360) % 360) * Math.PI / 180;
    for (let x = step / 2; x < w; x += step) {
      for (let y = step / 2; y < h; y += step) {
        this._drawArrow(ctx, x, y, rad, color);
      }
    }

    this._animFrame = requestAnimationFrame(() => this._animate());
  }

  _drawArrow(ctx, x, y, rad, color) {
    const len = 18;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rad);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -len / 2);
    ctx.lineTo(0, len / 2);
    // arrowhead
    ctx.moveTo(0, -len / 2);
    ctx.lineTo(-5, -len / 2 + 8);
    ctx.moveTo(0, -len / 2);
    ctx.lineTo(5, -len / 2 + 8);
    ctx.stroke();
    ctx.restore();
  }
}

export default function WindLayer({ windDeg, windSpeed }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (windDeg == null) return;

    // Remove old
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