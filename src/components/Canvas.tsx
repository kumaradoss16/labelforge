/**
 * WYSIWYG Label Canvas Component
 * Real physical geometry in millimeters, physical rulers, snap-to-grid,
 * multi-touch friendly selection handles, and deterministic SVG rendering.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  LabelDocument,
  LabelObject,
  PhysicalUnit,
} from '../types';
import {
  mmToScreenPixels,
  screenPixelsToMm,
  snapToGrid,
  SCREEN_PX_PER_MM,
} from '../lib/units';
import { renderBarcodeSvg, BarcodeRenderResult } from '../lib/barcodeRenderer';
import { interpolateVariables, formatCounterString } from '../lib/serialization';

interface CanvasProps {
  document: LabelDocument;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (obj: LabelObject) => void;
  zoom: number;
  showGrid: boolean;
  snapGridEnabled: boolean;
  gridStepMm: number;
  liveDataPreview: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({
  document,
  selectedObjectId,
  onSelectObject,
  onUpdateObject,
  zoom,
  showGrid,
  snapGridEnabled,
  gridStepMm,
  liveDataPreview,
}) => {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cursorWorldPos, setCursorWorldPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mousePosMm, setMousePosMm] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging & Resizing State
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // handle name: 'nw', 'se', etc.
  const dragStartPos = useRef<{ mouseX: number; mouseY: number; objX: number; objY: number; objW: number; objH: number }>({
    mouseX: 0,
    mouseY: 0,
    objX: 0,
    objY: 0,
    objW: 0,
    objH: 0,
  });

  const selectedObject = document.objects.find((o) => o.id === selectedObjectId);

  // Cache barcode renderings asynchronously
  const [barcodeSvgCache, setBarcodeSvgCache] = useState<Record<string, BarcodeRenderResult>>({});

  useEffect(() => {
    let cancelled = false;
    const loadBarcodes = async () => {
      const newCache: Record<string, BarcodeRenderResult> = {};
      for (const obj of document.objects) {
        if (obj.type === 'barcode' || obj.type === 'qrcode' || obj.type === 'datamatrix') {
          const rawData = liveDataPreview
            ? interpolateVariables(obj.data, document.variables)
            : obj.data;

          const cacheKey = `${obj.id}-${obj.type}-${rawData}-${obj.width}-${obj.height}`;
          try {
            const res = await renderBarcodeSvg(
              obj.type === 'barcode' ? obj.symbologyId : obj.type,
              rawData,
              obj.width,
              obj.height,
              {
                color: obj.color,
                backgroundColor: obj.backgroundColor,
                showText: obj.type === 'barcode' ? obj.showHumanReadable : false,
                fontSize: obj.type === 'barcode' ? obj.humanReadableFontSize : 8,
              }
            );
            newCache[cacheKey] = res;
          } catch (e) {
            console.error('Barcode render error', e);
          }
        }
      }
      if (!cancelled) {
        setBarcodeSvgCache((prev) => ({ ...prev, ...newCache }));
      }
    };

    loadBarcodes();
    return () => {
      cancelled = true;
    };
  }, [document.objects, document.variables, liveDataPreview]);

  // Geometric layout constants
  const RULER_SIZE = 26; // px
  const OFFSET_X = 64; // px from world origin to label left edge
  const OFFSET_Y = 48; // px from world origin to label top edge

  const labelWidthPx = mmToScreenPixels(document.width, zoom);
  const labelHeightPx = mmToScreenPixels(document.height, zoom);
  const cornerRadiusPx = mmToScreenPixels(document.cornerRadius || 0, zoom);

  // Ample world size to cover studio in all directions
  const canvasWorldWidth = Math.max(labelWidthPx + OFFSET_X * 2 + 400, 1600);
  const canvasWorldHeight = Math.max(labelHeightPx + OFFSET_Y * 2 + 400, 1200);

  // Sync scroll positions for dual rulers
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollPos({
      x: e.currentTarget.scrollLeft,
      y: e.currentTarget.scrollTop,
    });
  };

  // Track cursor position in millimeters and world pixels
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!scrollViewportRef.current) return;
    const rect = scrollViewportRef.current.getBoundingClientRect();
    const mouseViewportX = e.clientX - rect.left;
    const mouseViewportY = e.clientY - rect.top;
    const worldX = mouseViewportX + scrollViewportRef.current.scrollLeft;
    const worldY = mouseViewportY + scrollViewportRef.current.scrollTop;

    setCursorWorldPos({ x: worldX, y: worldY });

    const labelMmX = screenPixelsToMm(worldX - OFFSET_X, zoom);
    const labelMmY = screenPixelsToMm(worldY - OFFSET_Y, zoom);

    setMousePosMm({
      x: Math.round(labelMmX * 10) / 10,
      y: Math.round(labelMmY * 10) / 10,
    });

    // Handle Active Dragging of Object
    if (isDragging && selectedObject && !selectedObject.locked) {
      const deltaMmX = screenPixelsToMm(e.clientX - dragStartPos.current.mouseX, zoom);
      const deltaMmY = screenPixelsToMm(e.clientY - dragStartPos.current.mouseY, zoom);

      let newX = dragStartPos.current.objX + deltaMmX;
      let newY = dragStartPos.current.objY + deltaMmY;

      if (snapGridEnabled) {
        newX = snapToGrid(newX, gridStepMm, true);
        newY = snapToGrid(newY, gridStepMm, true);
      }

      onUpdateObject({
        ...selectedObject,
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
      });
    }

    // Handle Active Resizing
    if (isResizing && selectedObject && !selectedObject.locked) {
      const deltaMmX = screenPixelsToMm(e.clientX - dragStartPos.current.mouseX, zoom);
      const deltaMmY = screenPixelsToMm(e.clientY - dragStartPos.current.mouseY, zoom);

      let { objX, objY, objW, objH } = dragStartPos.current;

      if (isResizing.includes('e')) objW += deltaMmX;
      if (isResizing.includes('s')) objH += deltaMmY;
      if (isResizing.includes('w')) {
        objX += deltaMmX;
        objW -= deltaMmX;
      }
      if (isResizing.includes('n')) {
        objY += deltaMmY;
        objH -= deltaMmY;
      }

      // Minimum bounds
      objW = Math.max(3, objW);
      objH = Math.max(2, objH);

      if (snapGridEnabled) {
        objX = snapToGrid(objX, gridStepMm, true);
        objY = snapToGrid(objY, gridStepMm, true);
        objW = snapToGrid(objW, gridStepMm, true);
        objH = snapToGrid(objH, gridStepMm, true);
      }

      onUpdateObject({
        ...selectedObject,
        x: Math.round(objX * 10) / 10,
        y: Math.round(objY * 10) / 10,
        width: Math.round(objW * 10) / 10,
        height: Math.round(objH * 10) / 10,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
  };

  const startDrag = (e: React.MouseEvent, obj: LabelObject) => {
    e.stopPropagation();
    onSelectObject(obj.id);
    if (obj.locked) return;

    setIsDragging(true);
    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      objX: obj.x,
      objY: obj.y,
      objW: obj.width,
      objH: obj.height,
    };
  };

  const startResize = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    if (!selectedObject || selectedObject.locked) return;
    setIsResizing(handle);
    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      objX: selectedObject.x,
      objY: selectedObject.y,
      objW: selectedObject.width,
      objH: selectedObject.height,
    };
  };

  // Keyboard micro-nudges
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedObject || selectedObject.locked) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 2.0 : 0.5;
        let newX = selectedObject.x;
        let newY = selectedObject.y;
        if (e.key === 'ArrowUp') newY -= step;
        if (e.key === 'ArrowDown') newY += step;
        if (e.key === 'ArrowLeft') newX -= step;
        if (e.key === 'ArrowRight') newX += step;
        onUpdateObject({
          ...selectedObject,
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject, onUpdateObject]);

  // Memoized tick elements for high-performance rendering
  const horizontalTicks = useMemo(() => {
    const ticks: React.ReactNode[] = [];
    const minMm = -Math.ceil(OFFSET_X / (SCREEN_PX_PER_MM * zoom));
    const maxMm = Math.ceil((canvasWorldWidth - OFFSET_X) / (SCREEN_PX_PER_MM * zoom));

    for (let mm = minMm; mm <= maxMm; mm++) {
      const x = OFFSET_X + mmToScreenPixels(mm, zoom);
      const isMajor = mm % 10 === 0;
      const isMedium = mm % 5 === 0;

      if (isMajor) {
        const isDocBoundary = mm === 0 || mm === document.width;
        ticks.push(
          <g key={`h-${mm}`}>
            <line
              x1={x}
              y1={RULER_SIZE - 12}
              x2={x}
              y2={RULER_SIZE}
              stroke={isDocBoundary ? '#fbbf24' : '#71717a'}
              strokeWidth={isDocBoundary ? 1.5 : 1}
            />
            <text
              x={x + 2}
              y={10}
              fill={isDocBoundary ? '#fbbf24' : '#71717a'}
              fontSize="9"
              fontFamily="monospace"
              fontWeight={isDocBoundary ? 'bold' : 'normal'}
            >
              {mm}
            </text>
          </g>
        );
      } else if (isMedium) {
        ticks.push(
          <line
            key={`h-${mm}`}
            x1={x}
            y1={RULER_SIZE - 7}
            x2={x}
            y2={RULER_SIZE}
            stroke="#52525b"
            strokeWidth={1}
          />
        );
      } else if (zoom >= 0.75) {
        ticks.push(
          <line
            key={`h-${mm}`}
            x1={x}
            y1={RULER_SIZE - 4}
            x2={x}
            y2={RULER_SIZE}
            stroke="#3f3f46"
            strokeWidth={1}
          />
        );
      }
    }
    return ticks;
  }, [document.width, zoom, canvasWorldWidth]);

  const verticalTicks = useMemo(() => {
    const ticks: React.ReactNode[] = [];
    const minMm = -Math.ceil(OFFSET_Y / (SCREEN_PX_PER_MM * zoom));
    const maxMm = Math.ceil((canvasWorldHeight - OFFSET_Y) / (SCREEN_PX_PER_MM * zoom));

    for (let mm = minMm; mm <= maxMm; mm++) {
      const y = OFFSET_Y + mmToScreenPixels(mm, zoom);
      const isMajor = mm % 10 === 0;
      const isMedium = mm % 5 === 0;

      if (isMajor) {
        const isDocBoundary = mm === 0 || mm === document.height;
        ticks.push(
          <g key={`v-${mm}`}>
            <line
              x1={RULER_SIZE - 12}
              y1={y}
              x2={RULER_SIZE}
              y2={y}
              stroke={isDocBoundary ? '#fbbf24' : '#71717a'}
              strokeWidth={isDocBoundary ? 1.5 : 1}
            />
            <text
              x={2}
              y={y - 2}
              fill={isDocBoundary ? '#fbbf24' : '#71717a'}
              fontSize="8"
              fontFamily="monospace"
              fontWeight={isDocBoundary ? 'bold' : 'normal'}
            >
              {mm}
            </text>
          </g>
        );
      } else if (isMedium) {
        ticks.push(
          <line
            key={`v-${mm}`}
            x1={RULER_SIZE - 7}
            y1={y}
            x2={RULER_SIZE}
            y2={y}
            stroke="#52525b"
            strokeWidth={1}
          />
        );
      } else if (zoom >= 0.75) {
        ticks.push(
          <line
            key={`v-${mm}`}
            x1={RULER_SIZE - 4}
            y1={y}
            x2={RULER_SIZE}
            y2={y}
            stroke="#3f3f46"
            strokeWidth={1}
          />
        );
      }
    }
    return ticks;
  }, [document.height, zoom, canvasWorldHeight]);

  return (
    <div
      className="flex-1 flex flex-col bg-[#121214] overflow-hidden relative select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => onSelectObject(null)}
    >
      {/* 1. TOP BAR: CORNER UNIT + HORIZONTAL RULER */}
      <div className="flex h-[26px] bg-[#18181b] border-b border-[#27272a] shrink-0 z-20">
        {/* Origin Corner Block */}
        <div
          className="w-[26px] h-[26px] bg-[#18181b] border-r border-[#27272a] flex items-center justify-center shrink-0 text-[9px] font-mono font-bold text-amber-400 select-none shadow-xs"
          title="Physical Metric Unit: Millimeters (mm)"
        >
          mm
        </div>

        {/* Top Horizontal Ruler Viewport */}
        <div className="flex-1 h-[26px] overflow-hidden relative bg-[#18181b]">
          <svg
            className="absolute top-0 left-0 pointer-events-none will-change-transform"
            width={canvasWorldWidth}
            height={RULER_SIZE}
            style={{ transform: `translateX(-${scrollPos.x}px)` }}
          >
            {/* Active printable label span */}
            <rect
              x={OFFSET_X}
              y={0}
              width={labelWidthPx}
              height={RULER_SIZE}
              fill="#222226"
            />
            {/* Safe margins on horizontal ruler */}
            <line
              x1={OFFSET_X + mmToScreenPixels(document.margins.left, zoom)}
              y1={RULER_SIZE - 9}
              x2={OFFSET_X + mmToScreenPixels(document.margins.left, zoom)}
              y2={RULER_SIZE}
              stroke="#38bdf8"
              strokeWidth={1.5}
            />
            <line
              x1={OFFSET_X + mmToScreenPixels(document.width - document.margins.right, zoom)}
              y1={RULER_SIZE - 9}
              x2={OFFSET_X + mmToScreenPixels(document.width - document.margins.right, zoom)}
              y2={RULER_SIZE}
              stroke="#38bdf8"
              strokeWidth={1.5}
            />
            {/* Selected object span highlight */}
            {selectedObject && (
              <rect
                x={OFFSET_X + mmToScreenPixels(selectedObject.x, zoom)}
                y={RULER_SIZE - 3}
                width={Math.max(2, mmToScreenPixels(selectedObject.width, zoom))}
                height={3}
                fill="#fbbf24"
              />
            )}
            {/* Label boundary vertical lines */}
            <line x1={OFFSET_X} y1={0} x2={OFFSET_X} y2={RULER_SIZE} stroke="#71717a" strokeWidth={1} />
            <line x1={OFFSET_X + labelWidthPx} y1={0} x2={OFFSET_X + labelWidthPx} y2={RULER_SIZE} stroke="#71717a" strokeWidth={1} />

            {/* Static Ticks */}
            {horizontalTicks}

            {/* Dynamic Cursor Hairline */}
            <line
              x1={cursorWorldPos.x}
              y1={0}
              x2={cursorWorldPos.x}
              y2={RULER_SIZE}
              stroke="#fbbf24"
              strokeWidth={1.5}
            />
            <polygon
              points={`${cursorWorldPos.x - 3},${RULER_SIZE} ${cursorWorldPos.x + 3},${RULER_SIZE} ${cursorWorldPos.x},${RULER_SIZE - 4}`}
              fill="#fbbf24"
            />
          </svg>
        </div>
      </div>

      {/* 2. BODY: VERTICAL RULER + STUDIO CANVAS SCROLL VIEWPORT */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Vertical Ruler Viewport */}
        <div className="w-[26px] h-full overflow-hidden relative bg-[#18181b] border-r border-[#27272a] shrink-0 z-20">
          <svg
            className="absolute top-0 left-0 pointer-events-none will-change-transform"
            width={RULER_SIZE}
            height={canvasWorldHeight}
            style={{ transform: `translateY(-${scrollPos.y}px)` }}
          >
            {/* Active printable label span */}
            <rect
              x={0}
              y={OFFSET_Y}
              width={RULER_SIZE}
              height={labelHeightPx}
              fill="#222226"
            />
            {/* Safe margins on vertical ruler */}
            <line
              x1={RULER_SIZE - 9}
              y1={OFFSET_Y + mmToScreenPixels(document.margins.top, zoom)}
              x2={RULER_SIZE}
              y2={OFFSET_Y + mmToScreenPixels(document.margins.top, zoom)}
              stroke="#38bdf8"
              strokeWidth={1.5}
            />
            <line
              x1={RULER_SIZE - 9}
              y1={OFFSET_Y + mmToScreenPixels(document.height - document.margins.bottom, zoom)}
              x2={RULER_SIZE}
              y2={OFFSET_Y + mmToScreenPixels(document.height - document.margins.bottom, zoom)}
              stroke="#38bdf8"
              strokeWidth={1.5}
            />
            {/* Selected object span highlight */}
            {selectedObject && (
              <rect
                x={RULER_SIZE - 3}
                y={OFFSET_Y + mmToScreenPixels(selectedObject.y, zoom)}
                width={3}
                height={Math.max(2, mmToScreenPixels(selectedObject.height, zoom))}
                fill="#fbbf24"
              />
            )}
            {/* Label boundary horizontal lines */}
            <line x1={0} y1={OFFSET_Y} x2={RULER_SIZE} y2={OFFSET_Y} stroke="#71717a" strokeWidth={1} />
            <line x1={0} y1={OFFSET_Y + labelHeightPx} x2={RULER_SIZE} y2={OFFSET_Y + labelHeightPx} stroke="#71717a" strokeWidth={1} />

            {/* Static Ticks */}
            {verticalTicks}

            {/* Dynamic Cursor Hairline */}
            <line
              x1={0}
              y1={cursorWorldPos.y}
              x2={RULER_SIZE}
              y2={cursorWorldPos.y}
              stroke="#fbbf24"
              strokeWidth={1.5}
            />
            <polygon
              points={`26,${cursorWorldPos.y - 3} 26,${cursorWorldPos.y + 3} 22,${cursorWorldPos.y}`}
              fill="#fbbf24"
            />
          </svg>
        </div>

        {/* Studio Canvas Scroll Viewport */}
        <div
          ref={scrollViewportRef}
          onScroll={handleScroll}
          onMouseMove={handleMouseMove}
          className="flex-1 overflow-auto bg-[#121214] relative focus:outline-none"
        >
          {/* Scrollable Canvas World that covers the studio */}
          <div
            className="relative"
            style={{
              width: canvasWorldWidth,
              height: canvasWorldHeight,
            }}
          >
            {/* Printable Surface Container */}
            <div
              id="printable-label-surface"
              ref={containerRef}
              className="absolute bg-white shadow-2xl transition-shadow border border-zinc-300"
              style={{
                left: OFFSET_X,
                top: OFFSET_Y,
                width: labelWidthPx,
                height: labelHeightPx,
                borderRadius: cornerRadiusPx,
                backgroundImage: showGrid
                  ? `radial-gradient(#d4d4d8 1px, transparent 1px)`
                  : 'none',
                backgroundSize: `${mmToScreenPixels(gridStepMm, zoom)}px ${mmToScreenPixels(gridStepMm, zoom)}px`,
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {/* Safe Margins Area (Dashed guideline) */}
              <div
                className="absolute border border-dashed border-sky-400/50 pointer-events-none"
                style={{
                  top: mmToScreenPixels(document.margins.top, zoom),
                  left: mmToScreenPixels(document.margins.left, zoom),
                  right: mmToScreenPixels(document.margins.right, zoom),
                  bottom: mmToScreenPixels(document.margins.bottom, zoom),
                  borderRadius: Math.max(0, cornerRadiusPx - 4),
                }}
              />

              {/* Render All Label Objects */}
              {document.objects.map((obj) => {
                if (obj.hidden) return null;

                const isSelected = obj.id === selectedObjectId;
                const xPx = mmToScreenPixels(obj.x, zoom);
                const yPx = mmToScreenPixels(obj.y, zoom);
                const wPx = mmToScreenPixels(obj.width, zoom);
                const hPx = mmToScreenPixels(obj.height, zoom);

                const cacheKey = `${obj.id}-${obj.type}-${
                  liveDataPreview ? interpolateVariables(obj.data || '', document.variables) : obj.data
                }-${obj.width}-${obj.height}`;

                const barcodeResult = barcodeSvgCache[cacheKey];

                return (
                  <div
                    key={obj.id}
                    onMouseDown={(e) => startDrag(e, obj)}
                    className={`absolute cursor-move select-none transition-all ${
                      isSelected
                        ? 'ring-2 ring-amber-500 ring-offset-1 z-30'
                        : 'hover:ring-1 hover:ring-zinc-400/70'
                    }`}
                    style={{
                      left: xPx,
                      top: yPx,
                      width: wPx,
                      height: hPx,
                      transform: obj.rotation ? `rotate(${obj.rotation}deg)` : 'none',
                      zIndex: obj.zIndex,
                    }}
                  >
                    {/* 1. TEXT OBJECT */}
                    {obj.type === 'text' && (
                      <div
                        className="w-full h-full flex items-center overflow-hidden"
                        style={{
                          fontFamily: obj.fontFamily || 'Plus Jakarta Sans',
                          fontSize: `${obj.fontSize * (zoom * 1.33)}px`,
                          fontWeight: obj.fontWeight || 'normal',
                          fontStyle: obj.fontStyle || 'normal',
                          color: obj.color || '#000000',
                          justifyContent:
                            obj.textAlign === 'center'
                              ? 'center'
                              : obj.textAlign === 'right'
                              ? 'flex-end'
                              : 'flex-start',
                        }}
                      >
                        {liveDataPreview ? interpolateVariables(obj.text, document.variables) : obj.text}
                      </div>
                    )}

                    {/* 2. BARCODE OBJECT (1D / QR / DataMatrix) */}
                    {(obj.type === 'barcode' || obj.type === 'qrcode' || obj.type === 'datamatrix') && (
                      <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
                        {barcodeResult ? (
                          <svg
                            viewBox={barcodeResult.viewBox}
                            className="w-full h-full"
                            preserveAspectRatio="none"
                            dangerouslySetInnerHTML={{ __html: barcodeResult.svgContent }}
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-[9px] font-mono text-zinc-500 border border-zinc-200">
                            Rendering {obj.type}...
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. SHAPE OBJECT */}
                    {obj.type === 'shape' && (
                      <div className="w-full h-full">
                        {obj.shapeType === 'line' ? (
                          <div
                            className="w-full"
                            style={{
                              height: `${Math.max(1, mmToScreenPixels(obj.strokeWidth, zoom))}px`,
                              backgroundColor: obj.strokeColor || '#000000',
                            }}
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{
                              borderWidth: `${Math.max(1, mmToScreenPixels(obj.strokeWidth, zoom))}px`,
                              borderColor: obj.strokeColor || '#000000',
                              borderStyle: 'solid',
                              backgroundColor: obj.fillColor || 'transparent',
                              borderRadius:
                                obj.shapeType === 'circle'
                                  ? '9999px'
                                  : `${mmToScreenPixels(obj.cornerRadius || 0, zoom)}px`,
                            }}
                          />
                        )}
                      </div>
                    )}

                    {/* 4. COUNTER OBJECT */}
                    {obj.type === 'counter' && (
                      <div
                        className="w-full h-full flex items-center font-mono font-bold"
                        style={{
                          fontSize: `${obj.fontSize * (zoom * 1.33)}px`,
                          color: obj.color || '#000000',
                        }}
                      >
                        {formatCounterString(obj)}
                      </div>
                    )}

                    {/* 5. DATETIME OBJECT */}
                    {obj.type === 'datetime' && (
                      <div
                        className="w-full h-full flex items-center font-mono"
                        style={{
                          fontSize: `${obj.fontSize * (zoom * 1.33)}px`,
                          color: obj.color || '#000000',
                        }}
                      >
                        {obj.prefix}
                        {(() => {
                          const d = new Date();
                          if (obj.offsetDays) d.setDate(d.getDate() + obj.offsetDays);
                          return d.toISOString().split('T')[0];
                        })()}
                        {obj.suffix}
                      </div>
                    )}

                    {/* RESIZE HANDLES (When Selected) */}
                    {isSelected && !obj.locked && (
                      <>
                        {/* Dimension Badge */}
                        <div className="absolute -top-5 left-0 bg-zinc-900 text-amber-400 text-[9px] font-mono px-1 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-50">
                          {obj.width} × {obj.height} mm
                        </div>

                        {/* 8 Handles */}
                        {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((h) => {
                          const posClasses: Record<string, string> = {
                            nw: '-top-1.5 -left-1.5 cursor-nwse-resize',
                            n: '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize',
                            ne: '-top-1.5 -right-1.5 cursor-nesw-resize',
                            e: 'top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize',
                            se: '-bottom-1.5 -right-1.5 cursor-nwse-resize',
                            s: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize',
                            sw: '-bottom-1.5 -left-1.5 cursor-nesw-resize',
                            w: 'top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize',
                          };

                          return (
                            <div
                              key={h}
                              onMouseDown={(e) => startResize(e, h)}
                              className={`absolute w-3 h-3 bg-amber-400 border-2 border-zinc-900 rounded-sm z-40 ${posClasses[h]}`}
                            />
                          );
                        })}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Live Measurement HUD (Position & Dimensions) */}
      <div className="absolute bottom-2 right-4 z-30 pointer-events-none flex items-center space-x-2 bg-[#18181b]/90 backdrop-blur-xs border border-[#27272a] px-3 py-1 rounded-full text-[10px] font-mono text-zinc-400 shadow-lg">
        <span className="text-amber-400 font-bold">X: {mousePosMm.x.toFixed(1)} mm</span>
        <span className="text-zinc-600">|</span>
        <span className="text-amber-400 font-bold">Y: {mousePosMm.y.toFixed(1)} mm</span>
        <span className="text-zinc-600">|</span>
        <span>{document.width} × {document.height} mm</span>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-300">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};
