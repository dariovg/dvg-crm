"use client";

import { useRef, useState } from "react";

export default function QuoteSignaturePad({ onChange, disabled = false }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [mode, setMode] = useState("draw");
  const [typedName, setTypedName] = useState("");

  function getCtx() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }

  function pos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startDraw(e) {
    if (disabled || mode !== "draw") return;
    e.preventDefault();
    drawing.current = true;
    const ctx = getCtx();
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function draw(e) {
    if (!drawing.current || disabled || mode !== "draw") return;
    e.preventDefault();
    const ctx = getCtx();
    const p = pos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0A0E27";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    emitDraw();
  }

  function endDraw() {
    drawing.current = false;
  }

  function emitDraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange({ mode: "draw", dataUrl: canvas.toDataURL("image/png"), signedByName: null });
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  }

  function handleTypedName(value) {
    setTypedName(value);
    const trimmed = value.trim();
    if (trimmed.length >= 2) {
      onChange({ mode: "typed", dataUrl: null, signedByName: trimmed });
    } else {
      onChange(null);
    }
  }

  return (
    <div className="quote-signature-pad">
      <div className="quote-signature-tabs">
        <button
          type="button"
          className={`quote-signature-tab${mode === "draw" ? " quote-signature-tab--active" : ""}`}
          onClick={() => setMode("draw")}
          disabled={disabled}
        >
          Dibujar firma
        </button>
        <button
          type="button"
          className={`quote-signature-tab${mode === "typed" ? " quote-signature-tab--active" : ""}`}
          onClick={() => setMode("typed")}
          disabled={disabled}
        >
          Escribir nombre
        </button>
      </div>

      {mode === "draw" ? (
        <>
          <canvas
            ref={canvasRef}
            className="quote-signature-canvas"
            width={600}
            height={180}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          <p className="quote-signature-hint">Firma con el ratón o el dedo en el recuadro.</p>
          <button type="button" className="btn-secondary btn-sm" onClick={clear} disabled={disabled}>
            Borrar firma
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            className="quote-signature-name-input"
            placeholder="Nombre completo del firmante"
            value={typedName}
            onChange={(e) => handleTypedName(e.target.value)}
            disabled={disabled}
            autoComplete="name"
          />
          <p className="quote-signature-hint">
            Al escribir tu nombre aceptas el presupuesto en nombre del cliente.
          </p>
        </>
      )}
    </div>
  );
}
