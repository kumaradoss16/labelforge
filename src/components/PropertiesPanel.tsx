/**
 * Properties Inspector & Layer Tree Panel - Industrial Dark Theme
 * Precise object geometry, typography, symbology options, and document configuration.
 */

import React, { useState } from 'react';
import {
  Sliders,
  Layers,
  Settings,
  Database,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  RotateCw,
} from 'lucide-react';
import {
  LabelDocument,
  LabelObject,
  PhysicalUnit,
} from '../types';
import { BARCODE_SYMBOLOGIES } from '../lib/barcodeCatalog';
import { AlignmentControls } from './AlignmentControls';

interface PropertiesPanelProps {
  document: LabelDocument;
  onUpdateDocument: (doc: LabelDocument) => void;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (obj: LabelObject) => void;
  onDuplicateObject: (obj: LabelObject) => void;
  onDeleteObject: (id: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  document,
  onUpdateDocument,
  selectedObjectId,
  onSelectObject,
  onUpdateObject,
  onDuplicateObject,
  onDeleteObject,
}) => {
  const [activeTab, setActiveTab] = useState<'object' | 'document' | 'layers' | 'data'>('object');
  const selectedObject = document.objects.find((o) => o.id === selectedObjectId);

  const objectIndex = selectedObjectId
    ? document.objects.findIndex((o) => o.id === selectedObjectId)
    : -1;
  const isAtFront = objectIndex !== -1 && objectIndex === document.objects.length - 1;
  const isAtBack = objectIndex !== -1 && objectIndex === 0;

  const handleReorder = (
    direction: 'bring-to-front' | 'send-to-back' | 'move-up' | 'move-down'
  ) => {
    if (!selectedObjectId) return;
    const index = document.objects.findIndex((o) => o.id === selectedObjectId);
    if (index === -1) return;

    const newObjects = [...document.objects];

    if (direction === 'bring-to-front') {
      if (index === newObjects.length - 1) return;
      const [item] = newObjects.splice(index, 1);
      newObjects.push(item);
    } else if (direction === 'send-to-back') {
      if (index === 0) return;
      const [item] = newObjects.splice(index, 1);
      newObjects.unshift(item);
    } else if (direction === 'move-up') {
      if (index >= newObjects.length - 1) return;
      const temp = newObjects[index];
      newObjects[index] = newObjects[index + 1];
      newObjects[index + 1] = temp;
    } else if (direction === 'move-down') {
      if (index <= 0) return;
      const temp = newObjects[index];
      newObjects[index] = newObjects[index - 1];
      newObjects[index - 1] = temp;
    }

    // Reassign zIndices 1...N
    newObjects.forEach((o, i) => {
      o.zIndex = i + 1;
    });

    onUpdateDocument({ ...document, objects: newObjects });
  };

  return (
    <aside className="w-72 md:w-80 bg-[#18181b] border-l border-[#27272a] flex flex-col select-none shrink-0 z-20 overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex border-b border-[#27272a] bg-[#121214] p-1 text-xs">
        <button
          onClick={() => setActiveTab('object')}
          className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1 transition-colors ${
            activeTab === 'object'
              ? 'bg-zinc-800 text-zinc-100 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Object</span>
        </button>
        <button
          onClick={() => setActiveTab('document')}
          className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1 transition-colors ${
            activeTab === 'document'
              ? 'bg-zinc-800 text-zinc-100 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Label</span>
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1 transition-colors ${
            activeTab === 'layers'
              ? 'bg-zinc-800 text-zinc-100 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1 transition-colors ${
            activeTab === 'data'
              ? 'bg-zinc-800 text-zinc-100 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Vars</span>
        </button>
      </div>

      {/* TAB CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-3 text-xs space-y-4">
        {/* ----------------- TAB 1: OBJECT PROPERTIES ----------------- */}
        {activeTab === 'object' && (
          <div>
            {!selectedObject ? (
              <div className="text-center py-12 px-4 text-zinc-500">
                <Sliders className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                <p className="font-medium text-zinc-400">No Object Selected</p>
                <p className="text-[11px] mt-1">Tap any element on the canvas to inspect its geometry, content, or barcode symbology.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header with Object Type & Actions */}
                <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
                  <div className="flex items-center space-x-1.5">
                    <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                      {selectedObject.type}
                    </span>
                    <input
                      type="text"
                      value={selectedObject.name}
                      onChange={(e) => onUpdateObject({ ...selectedObject, name: e.target.value })}
                      className="bg-transparent text-zinc-200 font-medium focus:outline-none border-b border-transparent focus:border-zinc-500 px-0.5 max-w-36"
                    />
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onUpdateObject({ ...selectedObject, locked: !selectedObject.locked })}
                      className={`p-1.5 rounded ${
                        selectedObject.locked ? 'text-amber-400 bg-zinc-800' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title={selectedObject.locked ? 'Unlock' : 'Lock'}
                    >
                      {selectedObject.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onDuplicateObject(selectedObject)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteObject(selectedObject.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-zinc-800"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Geometry Section */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Geometry (mm)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500">X Position</label>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedObject.x}
                        onChange={(e) => onUpdateObject({ ...selectedObject, x: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">Y Position</label>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedObject.y}
                        onChange={(e) => onUpdateObject({ ...selectedObject, y: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">Width</label>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedObject.width}
                        onChange={(e) => onUpdateObject({ ...selectedObject, width: Math.max(1, parseFloat(e.target.value) || 1) })}
                        className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">Height</label>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedObject.height}
                        onChange={(e) => onUpdateObject({ ...selectedObject, height: Math.max(1, parseFloat(e.target.value) || 1) })}
                        className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                      />
                    </div>
                  </div>

                  {/* Rotation control */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-zinc-500">Object Rotation</span>
                    <button
                      onClick={() =>
                        onUpdateObject({
                          ...selectedObject,
                          rotation: (((selectedObject.rotation + 90) % 360) as 0 | 90 | 180 | 270),
                        })
                      }
                      className="flex items-center space-x-1 px-2.5 py-1 bg-[#121214] border border-[#27272a] rounded text-zinc-300 hover:text-zinc-100 transition-colors"
                    >
                      <RotateCw className="w-3 h-3 text-amber-400" />
                      <span className="font-mono text-xs">{selectedObject.rotation}°</span>
                    </button>
                  </div>
                </div>

                {/* Alignment Controls Component */}
                <AlignmentControls
                  selectedObject={selectedObject}
                  document={document}
                  onUpdateObject={onUpdateObject}
                />

                {/* Layer Order (Z-Index) Controls */}
                <div className="bg-[#121214] border border-[#27272a] rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Layer Order (Z-Index)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                      Layer {objectIndex + 1} of {document.objects.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleReorder('bring-to-front')}
                      disabled={isAtFront}
                      className={`min-h-[32px] py-1 px-2 rounded flex items-center justify-center space-x-1.5 transition-colors ${
                        isAtFront
                          ? 'bg-[#18181b] text-zinc-600 cursor-not-allowed border border-transparent'
                          : 'bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-[#27272a]'
                      }`}
                      title="Bring to Front (Top of Layer Stack)"
                    >
                      <ChevronsUp className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[10px] font-medium">Bring to Front</span>
                    </button>

                    <button
                      onClick={() => handleReorder('move-up')}
                      disabled={isAtFront}
                      className={`min-h-[32px] py-1 px-2 rounded flex items-center justify-center space-x-1.5 transition-colors ${
                        isAtFront
                          ? 'bg-[#18181b] text-zinc-600 cursor-not-allowed border border-transparent'
                          : 'bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-[#27272a]'
                      }`}
                      title="Move Up One Layer"
                    >
                      <ArrowUp className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[10px] font-medium">Move Up</span>
                    </button>

                    <button
                      onClick={() => handleReorder('move-down')}
                      disabled={isAtBack}
                      className={`min-h-[32px] py-1 px-2 rounded flex items-center justify-center space-x-1.5 transition-colors ${
                        isAtBack
                          ? 'bg-[#18181b] text-zinc-600 cursor-not-allowed border border-transparent'
                          : 'bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-[#27272a]'
                      }`}
                      title="Move Down One Layer"
                    >
                      <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[10px] font-medium">Move Down</span>
                    </button>

                    <button
                      onClick={() => handleReorder('send-to-back')}
                      disabled={isAtBack}
                      className={`min-h-[32px] py-1 px-2 rounded flex items-center justify-center space-x-1.5 transition-colors ${
                        isAtBack
                          ? 'bg-[#18181b] text-zinc-600 cursor-not-allowed border border-transparent'
                          : 'bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-[#27272a]'
                      }`}
                      title="Send to Back (Bottom of Layer Stack)"
                    >
                      <ChevronsDown className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[10px] font-medium">Send to Back</span>
                    </button>
                  </div>
                </div>

                {/* ---------------- TEXT CONTENT CONTROLS ---------------- */}
                {selectedObject.type === 'text' && (
                  <div className="space-y-3 pt-2 border-t border-[#27272a]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Typography
                    </span>
                    <div>
                      <label className="text-[10px] text-zinc-500">Text Content (supports &#123;&#123;variable&#125;&#125;)</label>
                      <textarea
                        rows={2}
                        value={selectedObject.text}
                        onChange={(e) => onUpdateObject({ ...selectedObject, text: e.target.value })}
                        className="w-full bg-[#121214] border border-[#27272a] rounded p-2 text-zinc-200 font-mono text-xs focus:outline-none focus:border-zinc-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-500">Font Family</label>
                        <select
                          value={selectedObject.fontFamily}
                          onChange={(e) => onUpdateObject({ ...selectedObject, fontFamily: e.target.value })}
                          className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200"
                        >
                          <option value="Plus Jakarta Sans">Sans Serif</option>
                          <option value="JetBrains Mono">JetBrains Mono</option>
                          <option value="Arial">Arial</option>
                          <option value="Courier New">Courier</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-500">Size (pt)</label>
                        <input
                          type="number"
                          value={selectedObject.fontSize}
                          onChange={(e) => onUpdateObject({ ...selectedObject, fontSize: parseFloat(e.target.value) || 8 })}
                          className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-500">Weight</label>
                        <select
                          value={selectedObject.fontWeight}
                          onChange={(e) =>
                            onUpdateObject({
                              ...selectedObject,
                              fontWeight: e.target.value as any,
                            })
                          }
                          className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200"
                        >
                          <option value="normal">Normal</option>
                          <option value="500">Medium</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-500">Text Align</label>
                        <select
                          value={selectedObject.textAlign}
                          onChange={(e) =>
                            onUpdateObject({
                              ...selectedObject,
                              textAlign: e.target.value as any,
                            })
                          }
                          className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------- BARCODE CONTROLS ---------------- */}
                {selectedObject.type === 'barcode' && (
                  <div className="space-y-3 pt-2 border-t border-[#27272a]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Symbology & Data
                    </span>

                    <div>
                      <label className="text-[10px] text-zinc-500">Symbology</label>
                      <select
                        value={selectedObject.symbologyId}
                        onChange={(e) => onUpdateObject({ ...selectedObject, symbologyId: e.target.value })}
                        className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1.5 text-zinc-200"
                      >
                        {BARCODE_SYMBOLOGIES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500">Data String (or &#123;&#123;var&#125;&#125;)</label>
                      <input
                        type="text"
                        value={selectedObject.data}
                        onChange={(e) => onUpdateObject({ ...selectedObject, data: e.target.value })}
                        className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1.5 text-zinc-200 font-mono text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center space-x-2 text-zinc-300">
                        <input
                          type="checkbox"
                          checked={selectedObject.showHumanReadable}
                          onChange={(e) => onUpdateObject({ ...selectedObject, showHumanReadable: e.target.checked })}
                          className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-0"
                        />
                        <span>Human-Readable Text</span>
                      </label>
                    </div>

                    {selectedObject.showHumanReadable && (
                      <div>
                        <label className="text-[10px] text-zinc-500">Text Size (pt)</label>
                        <input
                          type="number"
                          value={selectedObject.humanReadableFontSize}
                          onChange={(e) =>
                            onUpdateObject({
                              ...selectedObject,
                              humanReadableFontSize: parseFloat(e.target.value) || 8,
                            })
                          }
                          className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------- 2D QR / DATAMATRIX CONTROLS ---------------- */}
                {(selectedObject.type === 'qrcode' || selectedObject.type === 'datamatrix') && (
                  <div className="space-y-3 pt-2 border-t border-[#27272a]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      2D Matrix Payload
                    </span>

                    <div>
                      <label className="text-[10px] text-zinc-500">Encoded Content</label>
                      <textarea
                        rows={3}
                        value={selectedObject.data}
                        onChange={(e) => onUpdateObject({ ...selectedObject, data: e.target.value })}
                        className="w-full bg-[#121214] border border-[#27272a] rounded p-2 text-zinc-200 font-mono text-xs focus:outline-none focus:border-zinc-500"
                      />
                    </div>

                    {selectedObject.type === 'qrcode' && (
                      <div>
                        <label className="text-[10px] text-zinc-500">Error Correction Level</label>
                        <select
                          value={selectedObject.errorCorrection}
                          onChange={(e) =>
                            onUpdateObject({
                              ...selectedObject,
                              errorCorrection: e.target.value as any,
                            })
                          }
                          className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200"
                        >
                          <option value="L">L (7% recovery - Highest density)</option>
                          <option value="M">M (15% recovery - Standard)</option>
                          <option value="Q">Q (25% recovery - Industrial)</option>
                          <option value="H">H (30% recovery - Max durability)</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------- SERIAL COUNTER CONTROLS ---------------- */}
                {selectedObject.type === 'counter' && (
                  <div className="space-y-3 pt-2 border-t border-[#27272a]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Sequential Counter
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-500">Prefix</label>
                        <input
                          type="text"
                          value={selectedObject.prefix}
                          onChange={(e) => onUpdateObject({ ...selectedObject, prefix: e.target.value })}
                          className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500">Suffix</label>
                        <input
                          type="text"
                          value={selectedObject.suffix}
                          onChange={(e) => onUpdateObject({ ...selectedObject, suffix: e.target.value })}
                          className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-500">Start</label>
                        <input
                          type="number"
                          value={selectedObject.startValue}
                          onChange={(e) =>
                            onUpdateObject({
                              ...selectedObject,
                              startValue: parseInt(e.target.value, 10) || 0,
                              currentValue: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500">Step</label>
                        <input
                          type="number"
                          value={selectedObject.step}
                          onChange={(e) => onUpdateObject({ ...selectedObject, step: parseInt(e.target.value, 10) || 1 })}
                          className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500">Padding</label>
                        <input
                          type="number"
                          value={selectedObject.padding}
                          onChange={(e) => onUpdateObject({ ...selectedObject, padding: parseInt(e.target.value, 10) || 1 })}
                          className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 2: LABEL MEDIA SETTINGS ----------------- */}
        {activeTab === 'document' && (
          <div className="space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Media & Geometry
            </span>

            <div>
              <label className="text-[10px] text-zinc-500">Document Label Name</label>
              <input
                type="text"
                value={document.name}
                onChange={(e) => onUpdateDocument({ ...document, name: e.target.value })}
                className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1.5 text-zinc-200 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500">Width (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={document.width}
                  onChange={(e) => onUpdateDocument({ ...document, width: parseFloat(e.target.value) || 10 })}
                  className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500">Height (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={document.height}
                  onChange={(e) => onUpdateDocument({ ...document, height: parseFloat(e.target.value) || 10 })}
                  className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500">Target Printhead DPI</label>
                <select
                  value={document.dpi}
                  onChange={(e) => onUpdateDocument({ ...document, dpi: parseInt(e.target.value, 10) as 203 | 300 | 600 })}
                  className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                >
                  <option value={203}>203 DPI (8 dots/mm)</option>
                  <option value={300}>300 DPI (12 dots/mm)</option>
                  <option value={600}>600 DPI (24 dots/mm)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500">Corner Radius (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={document.cornerRadius}
                  onChange={(e) => onUpdateDocument({ ...document, cornerRadius: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                />
              </div>
            </div>

            {/* Margins */}
            <div className="pt-2 border-t border-[#27272a] space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Safe Margins (mm)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500">Top Margin</label>
                  <input
                    type="number"
                    value={document.margins.top}
                    onChange={(e) =>
                      onUpdateDocument({
                        ...document,
                        margins: { ...document.margins, top: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500">Left Margin</label>
                  <input
                    type="number"
                    value={document.margins.left}
                    onChange={(e) =>
                      onUpdateDocument({
                        ...document,
                        margins: { ...document.margins, left: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 3: LAYERS & OBJECT TREE ----------------- */}
        {activeTab === 'layers' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Elements ({document.objects.length})
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleReorder('bring-to-front')}
                  disabled={!selectedObjectId || isAtFront}
                  className="p-1 text-zinc-400 hover:text-zinc-200 disabled:text-zinc-600 disabled:cursor-not-allowed rounded hover:bg-zinc-800 transition-colors"
                  title="Bring to Front"
                >
                  <ChevronsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleReorder('move-up')}
                  disabled={!selectedObjectId || isAtFront}
                  className="p-1 text-zinc-400 hover:text-zinc-200 disabled:text-zinc-600 disabled:cursor-not-allowed rounded hover:bg-zinc-800 transition-colors"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleReorder('move-down')}
                  disabled={!selectedObjectId || isAtBack}
                  className="p-1 text-zinc-400 hover:text-zinc-200 disabled:text-zinc-600 disabled:cursor-not-allowed rounded hover:bg-zinc-800 transition-colors"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleReorder('send-to-back')}
                  disabled={!selectedObjectId || isAtBack}
                  className="p-1 text-zinc-400 hover:text-zinc-200 disabled:text-zinc-600 disabled:cursor-not-allowed rounded hover:bg-zinc-800 transition-colors"
                  title="Send to Back"
                >
                  <ChevronsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {[...document.objects].reverse().map((obj) => {
                const isSelected = obj.id === selectedObjectId;
                return (
                  <div
                    key={obj.id}
                    onClick={() => onSelectObject(obj.id)}
                    className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-zinc-800/90 border-amber-500/50 text-zinc-100'
                        : 'bg-[#121214] border-[#27272a] text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {obj.type.slice(0, 3).toUpperCase()}
                      </span>
                      <span className="truncate font-medium text-xs">{obj.name}</span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onUpdateObject({ ...obj, hidden: !obj.hidden })}
                        className="p-1 text-zinc-500 hover:text-zinc-200"
                      >
                        {obj.hidden ? <EyeOff className="w-3 h-3 text-red-400" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => onUpdateObject({ ...obj, locked: !obj.locked })}
                        className="p-1 text-zinc-500 hover:text-zinc-200"
                      >
                        {obj.locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------- TAB 4: DATA & VARIABLES ----------------- */}
        {activeTab === 'data' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Named Variables
            </span>
            <p className="text-[11px] text-zinc-500">
              Interpolate into any text or barcode using syntax <code className="text-amber-400 font-mono">&#123;&#123;KEY&#125;&#125;</code>.
            </p>

            <div className="space-y-2">
              {Object.entries(document.variables).map(([key, val]) => (
                <div key={key} className="bg-[#121214] border border-[#27272a] rounded p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-amber-400">&#123;&#123;{key}&#125;&#125;</span>
                    <button
                      onClick={() => {
                        const newVars = { ...document.variables };
                        delete newVars[key];
                        onUpdateDocument({ ...document, variables: newVars });
                      }}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => {
                      onUpdateDocument({
                        ...document,
                        variables: { ...document.variables, [key]: e.target.value },
                      });
                    }}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-zinc-200 text-xs font-mono"
                  />
                </div>
              ))}
            </div>

            {/* Add variable input */}
            <div className="pt-2 border-t border-[#27272a] flex items-center space-x-1">
              <input
                id="new-var-key"
                type="text"
                placeholder="VAR_NAME"
                className="flex-1 bg-[#121214] border border-[#27272a] rounded px-2 py-1 text-zinc-200 font-mono text-xs uppercase"
              />
              <button
                onClick={() => {
                  const input = window.document.getElementById('new-var-key') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    const cleanKey = input.value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
                    onUpdateDocument({
                      ...document,
                      variables: { ...document.variables, [cleanKey]: 'Default Value' },
                    });
                    input.value = '';
                  }
                }}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
