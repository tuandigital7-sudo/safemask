import React, { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { RedactionBox, RedactionMode, WatermarkConfig } from '../types';
import {
  applyRedactionBoxesToCanvas,
  applyWatermarkToCanvas,
  type CropRect,
} from '../engines/redactionEngine';

interface RedactionCanvasProps {
  source: HTMLImageElement | HTMLCanvasElement;
  boxes: RedactionBox[];
  onChangeBoxes: (next: RedactionBox[]) => void;
  activeMode: RedactionMode;
  activeColor?: string;
  watermark?: WatermarkConfig;
  zoom?: number;
  interactionMode?: 'draw' | 'pan' | 'crop';
  cropRect?: CropRect | null;
  onChangeCropRect?: (next: CropRect | null) => void;
  showBeforeAfter?: boolean;
  onSelectBox?: (id: string | null) => void;
  selectedBoxId?: string | null;
}

export const RedactionCanvas: React.FC<RedactionCanvasProps> = ({
  source,
  boxes,
  onChangeBoxes,
  activeMode,
  activeColor = '#10B981',
  watermark,
  zoom = 1,
  interactionMode = 'draw',
  cropRect,
  onChangeCropRect,
  showBeforeAfter = false,
  onSelectBox,
  selectedBoxId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const protectedCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);

  const [splitPos, setSplitPos] = useState(50);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<
    | null
    | {
        type: 'create' | 'move' | 'resize' | 'pan' | 'crop';
        startX: number;
        startY: number;
        boxId?: string;
        origBox?: RedactionBox;
        origPan?: { x: number; y: number };
      }
  >(null);
  const [draftRect, setDraftRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const srcW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const srcH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  // Render live preview canvas (burned redactions + watermark)
  useEffect(() => {
    const canvas = protectedCanvasRef.current;
    if (!canvas || srcW <= 0 || srcH <= 0) return;

    // Preview capped at 1400px for crisp 60fps interaction without RAM overhead
    const scale = Math.min(1, 1400 / Math.max(srcW, srcH));
    const pw = Math.max(1, Math.round(srcW * scale));
    const ph = Math.max(1, Math.round(srcH * scale));

    canvas.width = pw;
    canvas.height = ph;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, pw, ph);
    ctx.drawImage(source, 0, 0, pw, ph);
    applyRedactionBoxesToCanvas(ctx, pw, ph, boxes);
    applyWatermarkToCanvas(ctx, pw, ph, watermark);

    if (showBeforeAfter && originalCanvasRef.current) {
      const oCanvas = originalCanvasRef.current;
      oCanvas.width = pw;
      oCanvas.height = ph;
      const octx = oCanvas.getContext('2d');
      if (octx) {
        octx.clearRect(0, 0, pw, ph);
        octx.drawImage(source, 0, 0, pw, ph);
      }
    }
  }, [source, boxes, watermark, showBeforeAfter, srcW, srcH]);

  const getNormalizedPoint = (clientX: number, clientY: number) => {
    const el = protectedCanvasRef.current;
    if (!el) return { nx: 0, ny: 0 };
    const rect = el.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return { nx, ny };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (showBeforeAfter) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (interactionMode === 'pan') {
      setDragState({
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        origPan: { ...panOffset },
      });
      return;
    }

    const { nx, ny } = getNormalizedPoint(e.clientX, e.clientY);

    if (interactionMode === 'crop') {
      setDragState({ type: 'crop', startX: nx, startY: ny });
      setDraftRect({ x: nx, y: ny, width: 0, height: 0 });
      return;
    }

    onSelectBox?.(null);
    setDragState({ type: 'create', startX: nx, startY: ny });
    setDraftRect({ x: nx, y: ny, width: 0, height: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;

    if (dragState.type === 'pan' && dragState.origPan) {
      setPanOffset({
        x: dragState.origPan.x + (e.clientX - dragState.startX),
        y: dragState.origPan.y + (e.clientY - dragState.startY),
      });
      return;
    }

    const { nx, ny } = getNormalizedPoint(e.clientX, e.clientY);

    if (dragState.type === 'create' || dragState.type === 'crop') {
      const x = Math.min(dragState.startX, nx);
      const y = Math.min(dragState.startY, ny);
      const width = Math.abs(nx - dragState.startX);
      const height = Math.abs(ny - dragState.startY);
      setDraftRect({ x, y, width, height });
    } else if (dragState.type === 'move' && dragState.origBox && dragState.boxId) {
      const dx = nx - dragState.startX;
      const dy = ny - dragState.startY;
      const newX = Math.max(0, Math.min(1 - dragState.origBox.width, dragState.origBox.x + dx));
      const newY = Math.max(0, Math.min(1 - dragState.origBox.height, dragState.origBox.y + dy));
      onChangeBoxes(
        boxes.map((b) => (b.id === dragState.boxId ? { ...b, x: newX, y: newY } : b))
      );
    } else if (dragState.type === 'resize' && dragState.origBox && dragState.boxId) {
      const newW = Math.max(0.03, Math.min(1 - dragState.origBox.x, nx - dragState.origBox.x));
      const newH = Math.max(0.03, Math.min(1 - dragState.origBox.y, ny - dragState.origBox.y));
      onChangeBoxes(
        boxes.map((b) =>
          b.id === dragState.boxId ? { ...b, width: newW, height: newH } : b
        )
      );
    }
  };

  const handlePointerUp = () => {
    if (!dragState) return;
    if (dragState.type === 'create' && draftRect && draftRect.width > 0.015 && draftRect.height > 0.015) {
      const newBox: RedactionBox = {
        id: `box-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        x: draftRect.x,
        y: draftRect.y,
        width: draftRect.width,
        height: draftRect.height,
        mode: activeMode,
        color: activeColor,
        source: 'manual',
      };
      onChangeBoxes([...boxes, newBox]);
      onSelectBox?.(newBox.id);
    } else if (dragState.type === 'crop' && draftRect && draftRect.width > 0.05 && draftRect.height > 0.05) {
      onChangeCropRect?.(draftRect);
    }
    setDragState(null);
    setDraftRect(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl bg-graphite border border-borderdark flex items-center justify-center min-h-[220px] max-h-[44vh] select-none touch-none"
    >
      <div
        className="relative inline-block transition-transform duration-75"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <canvas
          ref={protectedCanvasRef}
          className="block max-w-full max-h-[42vh] w-auto h-auto rounded-lg"
        />

        {/* Before / After split overlay */}
        {showBeforeAfter && (
          <>
            <div
              className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
            >
              <canvas
                ref={originalCanvasRef}
                className="block w-full h-full object-contain"
              />
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-emeraldbrand-bright pointer-events-none"
              style={{ left: `${splitPos}%` }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={splitPos}
              onChange={(e) => setSplitPos(Number(e.target.value))}
              aria-label="Before and After comparison slider"
              className="absolute inset-x-4 bottom-3 z-30 accent-emerald-400 cursor-ew-resize"
              onPointerDown={(e) => e.stopPropagation()}
            />
          </>
        )}

        {/* Interactive Handles for Existing Boxes */}
        {!showBeforeAfter &&
          interactionMode === 'draw' &&
          boxes.map((box) => {
            const isSelected = selectedBoxId === box.id;
            return (
              <div
                key={box.id}
                style={{
                  left: `${box.x * 100}%`,
                  top: `${box.y * 100}%`,
                  width: `${box.width * 100}%`,
                  height: `${box.height * 100}%`,
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  onSelectBox?.(box.id);
                  const { nx, ny } = getNormalizedPoint(e.clientX, e.clientY);
                  setDragState({
                    type: 'move',
                    startX: nx,
                    startY: ny,
                    boxId: box.id,
                    origBox: { ...box },
                  });
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`absolute cursor-move rounded-sm transition-colors ${
                  isSelected
                    ? 'ring-2 ring-emeraldbrand-bright bg-emeraldbrand/10'
                    : 'ring-1 ring-emeraldbrand/40 hover:ring-emeraldbrand'
                }`}
              >
                {box.label && (
                  <span className="absolute -top-5 left-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-obsidian/90 text-emeraldbrand-bright border border-emeraldbrand/40 whitespace-nowrap pointer-events-none">
                    {box.label}
                  </span>
                )}
                {isSelected && (
                  <>
                    <button
                      type="button"
                      aria-label="Delete redaction box"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        onChangeBoxes(boxes.filter((b) => b.id !== box.id));
                        onSelectBox?.(null);
                      }}
                      className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md z-20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                        const { nx, ny } = getNormalizedPoint(e.clientX, e.clientY);
                        setDragState({
                          type: 'resize',
                          startX: nx,
                          startY: ny,
                          boxId: box.id,
                          origBox: { ...box },
                        });
                      }}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-emeraldbrand-bright border-2 border-obsidian cursor-nwse-resize z-20"
                    />
                  </>
                )}
              </div>
            );
          })}

        {/* Draft Drawing Box */}
        {draftRect && (
          <div
            style={{
              left: `${draftRect.x * 100}%`,
              top: `${draftRect.y * 100}%`,
              width: `${draftRect.width * 100}%`,
              height: `${draftRect.height * 100}%`,
            }}
            className={`absolute pointer-events-none border-2 ${
              interactionMode === 'crop'
                ? 'border-amber-400 bg-amber-400/15'
                : 'border-emeraldbrand-bright bg-emeraldbrand/20'
            }`}
          />
        )}

        {/* Active Crop Selection */}
        {interactionMode === 'crop' && cropRect && !draftRect && (
          <div
            style={{
              left: `${cropRect.x * 100}%`,
              top: `${cropRect.y * 100}%`,
              width: `${cropRect.width * 100}%`,
              height: `${cropRect.height * 100}%`,
            }}
            className="absolute pointer-events-none border-2 border-dashed border-amber-400 bg-amber-400/10"
          />
        )}
      </div>
    </div>
  );
};
