/**
 * Tablet Operator Print Station View
 * Purpose-built touch interface for shop floor, warehouse, and cleanroom tablet operators.
 * High-contrast, large touch targets, rapid batch input, and instant one-tap printing.
 */

import React, { useState } from 'react';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  Hash,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import { LabelDocument, PrinterProfile, PrintJobRecord } from '../types';
import { TEMPLATE_PRESETS } from '../lib/templatePresets';
import { interpolateVariables } from '../lib/serialization';

interface PrintStationViewProps {
  document: LabelDocument;
  onSelectDocument: (doc: LabelDocument) => void;
  printers: PrinterProfile[];
  selectedPrinterId: string;
  onSelectPrinter: (id: string) => void;
  printHistory: PrintJobRecord[];
  onExecutePrint: (copies: number) => void;
}

export const PrintStationView: React.FC<PrintStationViewProps> = ({
  document,
  onSelectDocument,
  printers,
  selectedPrinterId,
  onSelectPrinter,
  printHistory,
  onExecutePrint,
}) => {
  const [copies, setCopies] = useState(1);
  const [operatorId, setOperatorId] = useState('OP-418');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePresetIndex, setActivePresetIndex] = useState(0);

  // Operator editable variable fields
  const [localVars, setLocalVars] = useState<Record<string, string>>(document.variables);

  const selectedPrinter = printers.find((p) => p.id === selectedPrinterId) || printers[0];

  const handleVarChange = (key: string, val: string) => {
    setLocalVars((prev) => ({ ...prev, [key]: val }));
  };

  const handlePrintClick = () => {
    onExecutePrint(copies);
  };

  return (
    <div className="flex-1 bg-[#121214] flex flex-col md:flex-row select-none overflow-hidden">
      {/* LEFT COLUMN: TEMPLATE BROWSER & VARIABLE INPUTS */}
      <div className="w-full md:w-96 bg-[#18181b] border-r border-[#27272a] flex flex-col shrink-0 overflow-y-auto p-4 space-y-5">
        {/* Operator Badge & Printer Select */}
        <div className="space-y-2 pb-3 border-b border-[#27272a]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Tablet Station</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
              OPERATOR: {operatorId}
            </span>
          </div>

          <div>
            <label className="text-[10px] text-zinc-500 font-medium block mb-1">Target Printer</label>
            <select
              value={selectedPrinterId}
              onChange={(e) => onSelectPrinter(e.target.value)}
              className="w-full min-h-[44px] bg-[#121214] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-200 text-xs font-medium focus:outline-none focus:border-zinc-500"
            >
              {printers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.dpi} DPI, {p.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Template Picker */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Select Label Template
          </span>

          <div className="space-y-1.5">
            {TEMPLATE_PRESETS.map((preset) => {
              const isSelected = preset.name === document.name;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelectDocument(preset);
                    setLocalVars(preset.variables);
                  }}
                  className={`w-full min-h-[50px] p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-zinc-800 border-amber-500/50 text-zinc-100 shadow-sm'
                      : 'bg-[#121214] border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold text-xs text-zinc-200 truncate">{preset.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {preset.width} × {preset.height} mm ({preset.dpi} DPI)
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Operator Variable Fields (PO, Lot, Ship To, etc.) */}
        <div className="space-y-2.5 pt-2 border-t border-[#27272a]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Batch Variable Data
          </span>

          <div className="space-y-2">
            {Object.entries(localVars).map(([key, val]) => (
              <div key={key}>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-tight block mb-1">
                  {key.replace(/_/g, ' ')}
                </label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleVarChange(key, e.target.value)}
                  className="w-full min-h-[44px] bg-[#121214] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER / RIGHT: HIGH CONTRAST PREVIEW & TOUCH PRINT TRIGGER */}
      <div className="flex-1 flex flex-col justify-between p-4 md:p-8 overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
          <div>
            <h1 className="text-xl font-bold text-zinc-100">{document.name}</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ready for physical printhead output at {selectedPrinter.name} ({document.dpi} DPI)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-zinc-400 font-medium">Quantity:</span>
            <div className="flex items-center space-x-1 bg-[#18181b] border border-[#27272a] rounded-lg p-1">
              <button
                onClick={() => setCopies((c) => Math.max(1, c - 1))}
                className="w-10 h-10 rounded bg-zinc-800 text-zinc-200 font-bold hover:bg-zinc-700 flex items-center justify-center text-base"
              >
                -
              </button>
              <span className="w-14 text-center font-mono font-bold text-base text-amber-400">
                {copies}
              </span>
              <button
                onClick={() => setCopies((c) => c + 1)}
                className="w-10 h-10 rounded bg-zinc-800 text-zinc-200 font-bold hover:bg-zinc-700 flex items-center justify-center text-base"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Center: Tablet Label Preview Card */}
        <div className="flex-1 flex items-center justify-center py-6">
          <div
            className="bg-white rounded-lg shadow-2xl p-6 border border-zinc-400 max-w-full relative overflow-hidden"
            style={{
              aspectRatio: `${document.width} / ${document.height}`,
              maxHeight: '480px',
              maxWidth: '90%',
            }}
          >
            <div className="text-center text-zinc-950 flex flex-col justify-between h-full">
              <div className="space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                  {document.width} × {document.height} mm
                </div>
                <div className="text-lg md:text-xl font-bold text-zinc-900 leading-tight">
                  {localVars.SHIP_TO_NAME || localVars.DRUG_NAME || localVars.ITEM_DESC || document.name}
                </div>
                <div className="text-xs font-mono text-zinc-600">
                  {localVars.PO_NUMBER ? `PO: ${localVars.PO_NUMBER}` : localVars.NDC || ''}
                </div>
              </div>

              {/* Barcode representation */}
              <div className="py-4 flex flex-col items-center">
                <div className="font-mono text-xs font-semibold text-zinc-700 mb-1">
                  {localVars.SSCC || localVars.BATCH || 'LF-2026-SERIAL'}
                </div>
                <div className="w-4/5 h-16 bg-zinc-900 rounded flex items-center justify-center">
                  <span className="font-mono text-white text-xs tracking-widest font-bold">
                    ||||| |||| |||||||| |||| |||||
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-zinc-500 font-mono">
                Operator Verified: {operatorId} • Direct Thermal Mode
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions: BIG GREEN TOUCH PRINT BUTTON */}
        <div className="pt-4 border-t border-[#27272a] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-400">
            <span className="font-medium text-zinc-200">Thermal Stream:</span> 1 job ({copies} labels) •
            Total Roll Adv: ~{(copies * document.height) / 1000}m
          </div>

          <button
            onClick={handlePrintClick}
            className="w-full sm:w-auto min-h-[56px] px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-base shadow-lg flex items-center justify-center space-x-3 transition-transform active:scale-95"
          >
            <Printer className="w-6 h-6 text-zinc-950" />
            <span>PRINT {copies} {copies === 1 ? 'LABEL' : 'LABELS'} NOW</span>
          </button>
        </div>
      </div>
    </div>
  );
};
