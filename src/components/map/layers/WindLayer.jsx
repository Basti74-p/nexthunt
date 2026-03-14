import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

function getWindColor(speed) {
  if (speed < 5)  return [147, 197, 253]; // hell-blau: Windstille
  if (speed < 15) return [96, 165, 250];  // blau: leichter Wind
  if (speed < 30) return [52, 211, 153];  // grün: mäßiger Wind
  if (speed < 50) return [251, 191, 36];  // gelb: starker Wind
  return [248, 113, 113];                  // rot: Sturm
}

class WindCanvasLayer extends L.Layer {
  constructor(windDeg, windSpeed) {
    super();
    this.windDeg = windDeg;
    this.windSpeed = windSpeed;
    this._animFrame = null;
    this._canvas = null;
    this._particles = [];
    this._lastTime = 0;
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
    this._initParticles();
    this._animFrame = requestAnimationFrame((t) => this._animate(t));
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
    this._initParticles();
  }

  _resize() {
    const { x, y } = this._map.getSize();
    this._canvas.width = x;
    this._canvas.height = y;
  }

  _getDirectionVector() {
    // windDeg = Richtung AUS DER es kommt → Partikel bewegen sich in Gegenrichtung
    const rad = ((this.windDeg + 180) % 360) * Math.PI / 180;
    return { dx: Math.sin(rad), dy: -Math.cos(rad) };
  }

  _getPixelSpeed() {
    // windSpeed in km/h → px/frame bei 60fps
    // Skalierung: 10 km/h ≈ 1.5 px/frame, 50 km/h ≈ 5 px/frame
    return Math.max(0.8, Math.min(6, (this.windSpeed / 10) * 1.5));
  }

  _newParticle(w, h, { dx, dy }, pxSpeed, randomPos = false) {
    const trailLen = Math.floor(40 + Math.random() * 60); // 40–100 Punkte
    let x, y;

    if (randomPos) {
      x = Math.random() * w;
      y = Math.random() * h;
    } else {
      // Spawn vom Gegenwind-Rand
      if (Math.abs(dx) >= Math.abs(dy)) {
        x = dx > 0 ? -10 : w + 10;
        y = Math.random() * h;
      } else {
        x = Math.random() * w;
        y = dy > 0 ? -10 : h + 10;
      }
    }

    const speedVariation = 0.6 + Math.random() * 0.8;
    const speed = pxSpeed * speedVariation;
    const width = 0.8 + Math.random() * 1.4; // variable Linienbreite

    return {
      x, y, dx, dy, speed, width,
      trail: Array.from({ length: trailLen }, () => ({ x, y })),
      trailLen,
      age: Math.floor(Math.random() * trailLen),
      maxAge: 180 + Math.floor(Math.random() * 120),
      opacity: 0.25 + Math.random() * 0.3,
    };
  }

  _initParticles() {
    const { x: w, y: h } = this._map.getSize();
    const dir = this._getDirectionVector();
    const pxSpeed = this._getPixelSpeed();

    // Anzahl abhängig von Fenstergröße: ~1 Partikel pro 8000px²
    const count = Math.min(80, Math.max(20, Math.floor((w * h) / 8000)));
    this._particles = [];

    for (let i = 0; i < count; i++) {
      this._particles.push(this._newParticle(w, h, dir, pxSpeed, true));
    }
  }

  _animate(timestamp) {
    const { x: w, y: h } = this._map.getSize();
    const ctx = this._canvas.getContext("2d");
    const [r, g, b] = getWindColor(this.windSpeed);
    const dir = this._getDirectionVector();
    const pxSpeed = this._getPixelSpeed();

    // Jeden Frame komplett leeren → Karte bleibt sichtbar
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < this._particles.length; i++) {
      const p = this._particles[i];
      p.age++;

      // Bewegung
      p.x += p.dx * p.speed;
      p.y += p.dy * p.speed;

      // Trail aktualisieren
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > p.trailLen) p.trail.pop();

      const trail = p.trail;
      if (trail.length < 3) continue;

      // Trail als Gradient zeichnen
      const tLen = trail.length;
      for (let t = 0; t < tLen - 1; t++) {
        const ratio = (tLen - t) / tLen;
        const alpha = ratio * ratio * p.opacity; // quadratischer Fade → schöner
        ctx.beginPath();
        ctx.moveTo(trail[t].x, trail[t].y);
        ctx.lineTo(trail[t + 1].x, trail[t + 1].y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = p.width * ratio; // Linie wird zum Ende hin dünner
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }

      // Pfeilspitze am Kopf
      const head = trail[0];
      const ref = trail[Math.min(8, tLen - 1)];
      const angle = Math.atan2(head.y - ref.y, head.x - ref.x);
      const aw = p.width * 3;
      const al = p.width * 7;

      ctx.beginPath();
      ctx.moveTo(
        head.x + Math.cos(angle) * al * 0.5,
        head.y + Math.sin(angle) * al * 0.5
      );
      ctx.lineTo(
        head.x - al * Math.cos(angle) + aw * Math.cos(angle - Math.PI / 2),
        head.y - al * Math.sin(angle) + aw * Math.sin(angle - Math.PI / 2)
      );
      ctx.lineTo(
        head.x - al * Math.cos(angle) + aw * Math.cos(angle + Math.PI / 2),
        head.y - al * Math.sin(angle) + aw * Math.sin(angle + Math.PI / 2)
      );
      ctx.closePath();
      ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity * 0.9})`;
      ctx.fill();

      // Reset wenn außerhalb oder zu alt
      const out = p.x < -80 || p.x > w + 80 || p.y < -80 || p.y > h + 80;
      if (out || p.age > p.maxAge) {
        this._particles[i] = this._newParticle(w, h, dir, pxSpeed, false);
      }
    }

    this._animFrame = requestAnimationFrame((t) => this._animate(t));
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