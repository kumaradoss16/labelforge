/**
 * Left Toolbox Component - Industrial Dark Theme
 * Premium icons & typography, optimized for touch & tablet precision.
 */

import React from 'react';
import {
  MousePointer,
  Type,
  Barcode,
  QrCode,
  Grid,
  Square,
  Minus,
  Circle,
  Hash,
  Clock,
  Sparkles,
} from 'lucide-react';
import { LabelObjectType } from '../types';

interface ToolboxProps {
  selectedTool: 'select' | LabelObjectType;
  setSelectedTool: (tool: 'select' | LabelObjectType) => void;
  onQuickInsert: (type: LabelObjectType) => void;
  onOpenBarcodeWizard: () => void;
}

export const Toolbox: React.FC<ToolboxProps> = ({
  selectedTool,
  setSelectedTool,
  onQuickInsert,
  onOpenBarcodeWizard,
}) => {
  const tools = [
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      icon: MousePointer,
      action: () => setSelectedTool('select'),
      section: 'select',
    },
    {
      id: 'text',
      label: 'Text',
      shortcut: 'T',
      icon: Type,
      action: () => onQuickInsert('text'),
      section: 'insert',
      highlight: true,
    },
    {
      id: 'barcode',
      label: '1D Barcode',
      shortcut: 'B',
      icon: Barcode,
      action: () => onQuickInsert('barcode'),
      section: 'insert',
    },
    {
      id: 'qrcode',
      label: 'QR Code',
      shortcut: 'Q',
      icon: QrCode,
      action: () => onQuickInsert('qrcode'),
      section: 'insert',
    },
    {
      id: 'datamatrix',
      label: 'Data Matrix',
      shortcut: 'M',
      icon: Grid,
      action: () => onQuickInsert('datamatrix'),
      section: 'insert',
    },
    {
      id: 'rectangle',
      label: 'Box',
      shortcut: 'R',
      icon: Square,
      action: () => onQuickInsert('shape'),
      section: 'shapes',
      highlight: true,
    },
    {
      id: 'circle',
      label: 'Circle',
      shortcut: 'C',
      icon: Circle,
      action: () => onQuickInsert('shape'),
      section: 'shapes',
    },
    {
      id: 'line',
      label: 'Line',
      shortcut: 'L',
      icon: Minus,
      action: () => onQuickInsert('shape'),
      section: 'shapes',
    },
    {
      id: 'counter',
      label: 'Counter',
      shortcut: '#',
      icon: Hash,
      action: () => onQuickInsert('counter'),
      section: 'data',
    },
    {
      id: 'datetime',
      label: 'Date/Time',
      shortcut: 'D',
      icon: Clock,
      action: () => onQuickInsert('datetime'),
      section: 'data',
    },
  ];

  return (
    <aside className="w-20 md:w-22 bg-[#18181b] border-r border-[#27272a] flex flex-col justify-between py-2 select-none shrink-0 z-20 overflow-y-auto">
      <div className="flex flex-col items-center space-y-1 px-2">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = selectedTool === t.id;
          return (
            <button
              key={t.id}
              onClick={t.action}
              className={`w-full min-h-[44px] py-1.5 px-1 rounded-lg flex flex-col items-center justify-center transition-all ${
                isActive
                  ? 'bg-zinc-800 text-amber-400 border border-zinc-700 shadow-sm'
                  : t.highlight
                  ? 'bg-zinc-900/80 text-zinc-200 hover:text-amber-300 hover:bg-zinc-800 border border-zinc-800'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
              title={`${t.label} (${t.shortcut})`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : t.highlight ? 'text-amber-400' : 'text-zinc-300'}`} />
              <span className="text-[10px] font-medium tracking-tight mt-1 leading-none text-center">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Prominent Barcode Catalog Trigger Button */}
      <div className="px-2 pt-2 pb-1 border-t border-[#27272a] mt-2">
        <button
          onClick={onOpenBarcodeWizard}
          className="w-full py-2 px-1 rounded-lg flex flex-col items-center justify-center bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition-all shadow-xs group"
          title="Open Full 84 Symbologies Barcode Catalog"
        >
          <div className="flex items-center space-x-1 text-amber-400 group-hover:scale-105 transition-transform">
            <Barcode className="w-4 h-4" />
            <Sparkles className="w-3 h-3 text-amber-400" />
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-1 leading-tight text-center text-amber-200">
            Catalog
          </span>
          <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold mt-0.5">
            84 Symb
          </span>
        </button>
      </div>
    </aside>
  );
};
