/**
 * Hardware Printer Fleet Manager Modal
 * Manage Zebra ZT/ZD, TSC, Brother, and network spoolers with DPI & connection status.
 */

import React, { useState } from 'react';
import { Printer, X, Plus, Check, Trash2, Wifi, Activity } from 'lucide-react';
import { PrinterProfile } from '../types';

interface PrinterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  printers: PrinterProfile[];
  onUpdatePrinters: (printers: PrinterProfile[]) => void;
  selectedPrinterId: string;
  onSelectPrinter: (id: string) => void;
}

export const PrinterManagerModal: React.FC<PrinterManagerModalProps> = ({
  isOpen,
  onClose,
  printers,
  onUpdatePrinters,
  selectedPrinterId,
  onSelectPrinter,
}) => {
  const [testPrintSuccess, setTestPrintSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestPrint = (p: PrinterProfile) => {
    setTestPrintSuccess(`Test configuration pattern sent to ${p.name} (${p.language})`);
    setTimeout(() => setTestPrintSuccess(null), 3000);
  };

  const handleSetDefault = (id: string) => {
    const updated = printers.map((p) => ({
      ...p,
      isDefault: p.id === id,
    }));
    onUpdatePrinters(updated);
    onSelectPrinter(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-zinc-800 text-amber-400 border border-zinc-700">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Printer Fleet & Hardware Profiles</h2>
              <p className="text-xs text-zinc-400">
                Manage industrial direct thermal and thermal transfer printers.
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

        {testPrintSuccess && (
          <div className="mx-5 mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{testPrintSuccess}</span>
          </div>
        )}

        {/* Printer list */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {printers.map((p) => {
            const isSelected = p.id === selectedPrinterId;
            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-zinc-800/90 border-amber-500/60 shadow-sm'
                    : 'bg-[#121214] border-[#27272a] hover:border-zinc-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-zinc-200">{p.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                      {p.language}
                    </span>
                    {p.isDefault && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        DEFAULT
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-zinc-400 flex items-center space-x-3">
                    <span>
                      {p.manufacturer} {p.model}
                    </span>
                    <span>•</span>
                    <span className="font-mono">{p.dpi} DPI</span>
                    <span>•</span>
                    <span>{p.connection}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px] text-zinc-500">{p.address}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTestPrint(p)}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors"
                  >
                    Test Print
                  </button>
                  <button
                    onClick={() => handleSetDefault(p.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 font-semibold'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {isSelected ? 'Active' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#27272a] bg-[#121214] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
