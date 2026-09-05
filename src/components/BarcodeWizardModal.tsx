/**
 * Barcode Wizard & 84 Symbologies Catalog Modal
 * Full categorization, search filtering, capability badge, and live vector preview.
 */

import React, { useState, useEffect } from 'react';
import { Search, X, Check, Barcode, ShieldAlert, Sparkles } from 'lucide-react';
import { BarcodeSymbologyDefinition, SymbologyCategory } from '../types';
import { BARCODE_SYMBOLOGIES } from '../lib/barcodeCatalog';
import { renderBarcodeSvg, BarcodeRenderResult } from '../lib/barcodeRenderer';

interface BarcodeWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSymbology: (symbology: BarcodeSymbologyDefinition) => void;
}

const CATEGORIES: ('All' | SymbologyCategory)[] = [
  'All',
  'Linear 1D',
  '2D Matrix',
  'GS1',
  'Postal',
  'Retail & ISBN',
  'Specialized',
];

export const BarcodeWizardModal: React.FC<BarcodeWizardModalProps> = ({
  isOpen,
  onClose,
  onInsertSymbology,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | SymbologyCategory>('All');
  const [selectedSymbology, setSelectedSymbology] = useState<BarcodeSymbologyDefinition>(
    BARCODE_SYMBOLOGIES[0]
  );
  const [previewResult, setPreviewResult] = useState<BarcodeRenderResult | null>(null);

  // Filter symbologies
  const filtered = BARCODE_SYMBOLOGIES.filter((s) => {
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.aliases.some((a) => a.toLowerCase().includes(q)) ||
      s.description.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  // Render preview
  useEffect(() => {
    let active = true;
    const gen = async () => {
      try {
        const res = await renderBarcodeSvg(
          selectedSymbology.id,
          selectedSymbology.defaultData,
          60,
          25,
          { showText: selectedSymbology.supportsHumanReadableText }
        );
        if (active) setPreviewResult(res);
      } catch (err) {
        console.error(err);
      }
    };
    gen();
    return () => {
      active = false;
    };
  }, [selectedSymbology]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-zinc-800 text-amber-400 border border-zinc-700">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100 flex items-center space-x-2">
                <span>Barcode Symbology Catalog</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  84 Symbologies
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Independent BarTender-class symbology architecture with live vector preview.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-[#27272a] bg-[#121214] flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 84 barcodes (e.g. Code 128, QR, Postal)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-zinc-800 text-amber-400 border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-column catalog & preview */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left: Symbology List */}
          <div className="md:col-span-7 border-r border-[#27272a] overflow-y-auto p-3 space-y-1.5 max-h-[50vh] md:max-h-[60vh]">
            <div className="text-[11px] text-zinc-500 pb-1 font-mono">
              Found {filtered.length} symbologies
            </div>
            {filtered.map((sym) => {
              const isSelected = selectedSymbology.id === sym.id;
              return (
                <div
                  key={sym.id}
                  onClick={() => setSelectedSymbology(sym)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-zinc-800 border-amber-500/50 text-zinc-100 shadow-sm'
                      : 'bg-[#121214] border-[#27272a] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs text-zinc-200">{sym.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#18181b] text-zinc-400 border border-zinc-800">
                        {sym.dimension}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate max-w-xs mt-0.5">
                      {sym.description}
                    </div>
                  </div>

                  {/* Capability Badge */}
                  <div className="shrink-0 pl-2">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                        sym.capability === 'SUPPORTED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : sym.capability === 'PARTIAL'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                      }`}
                    >
                      {sym.capability}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Detailed Symbology Inspector & Live Vector Preview */}
          <div className="md:col-span-5 bg-[#121214] p-5 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[60vh]">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                    {selectedSymbology.category}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    ID: {selectedSymbology.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mt-1">{selectedSymbology.name}</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {selectedSymbology.description}
                </p>
              </div>

              {/* LIVE DETERMINISTIC VECTOR PREVIEW */}
              <div className="bg-white rounded-lg p-4 flex flex-col items-center justify-center border border-zinc-300 min-h-[120px]">
                {previewResult ? (
                  <svg
                    viewBox={previewResult.viewBox}
                    className="w-full max-h-24"
                    preserveAspectRatio="xMidYMid meet"
                    dangerouslySetInnerHTML={{ __html: previewResult.svgContent }}
                  />
                ) : (
                  <div className="text-zinc-500 text-xs font-mono">Generating vector preview...</div>
                )}
              </div>

              {/* Specifications Grid */}
              <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Supported Output:</span>
                  <span className="text-zinc-200 font-mono">
                    {selectedSymbology.printerLanguages.join(', ') || 'Vector Canvas'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Human Readable:</span>
                  <span className="text-zinc-200 font-mono">
                    {selectedSymbology.supportsHumanReadableText ? 'Yes (Auto / Custom)' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">GS1 Compliant:</span>
                  <span className="text-zinc-200 font-mono">
                    {selectedSymbology.supportsGS1 ? 'Yes (FNC1 + AIs)' : 'No'}
                  </span>
                </div>
                {selectedSymbology.characterSetHint && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Allowed Characters:</span>
                    <span className="text-zinc-300 font-mono text-[10px]">
                      {selectedSymbology.characterSetHint}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Insert Button */}
            <div className="pt-4 mt-4 border-t border-[#27272a]">
              <button
                onClick={() => {
                  onInsertSymbology(selectedSymbology);
                  onClose();
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg text-xs shadow flex items-center justify-center space-x-2 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Insert {selectedSymbology.name} onto Canvas</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
