/**
 * Alignment Controls Component - Industrial Dark Theme
 * Provides high-precision alignment controls (left, center, right, top, bottom, middle)
 * for the currently selected object on the canvas.
 */

import React from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUpToLine,
  ArrowDownToLine,
  Minimize2,
  Crosshair,
} from 'lucide-react';
import { LabelDocument, LabelObject } from '../types';

export type AlignmentType =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom'
  | 'center-both';

interface AlignmentControlsProps {
  selectedObject: LabelObject;
  document: LabelDocument;
  onUpdateObject: (updated: LabelObject) => void;
  useMargins?: boolean;
}

export const AlignmentControls: React.FC<AlignmentControlsProps> = ({
  selectedObject,
  document,
  onUpdateObject,
  useMargins = true,
}) => {
  const align = (type: AlignmentType) => {
    let newX = selectedObject.x;
    let newY = selectedObject.y;

    const leftBoundary = useMargins ? document.margins.left : 0;
    const rightBoundary = useMargins
      ? document.width - document.margins.right
      : document.width;
    const topBoundary = useMargins ? document.margins.top : 0;
    const bottomBoundary = useMargins
      ? document.height - document.margins.bottom
      : document.height;

    switch (type) {
      case 'left':
        newX = leftBoundary;
        break;
      case 'center':
        newX = (document.width - selectedObject.width) / 2;
        break;
      case 'right':
        newX = rightBoundary - selectedObject.width;
        break;
      case 'top':
        newY = topBoundary;
        break;
      case 'middle':
        newY = (document.height - selectedObject.height) / 2;
        break;
      case 'bottom':
        newY = bottomBoundary - selectedObject.height;
        break;
      case 'center-both':
        newX = (document.width - selectedObject.width) / 2;
        newY = (document.height - selectedObject.height) / 2;
        break;
    }

    onUpdateObject({
      ...selectedObject,
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
    });
  };

  const horizontalControls = [
    {
      type: 'left' as const,
      label: 'Align Left',
      shortLabel: 'Left',
      icon: AlignLeft,
    },
    {
      type: 'center' as const,
      label: 'Center Horizontal',
      shortLabel: 'Center',
      icon: AlignCenter,
    },
    {
      type: 'right' as const,
      label: 'Align Right',
      shortLabel: 'Right',
      icon: AlignRight,
    },
  ];

  const verticalControls = [
    {
      type: 'top' as const,
      label: 'Align Top',
      shortLabel: 'Top',
      icon: ArrowUpToLine,
    },
    {
      type: 'middle' as const,
      label: 'Center Vertical',
      shortLabel: 'Middle',
      icon: Minimize2,
    },
    {
      type: 'bottom' as const,
      label: 'Align Bottom',
      shortLabel: 'Bottom',
      icon: ArrowDownToLine,
    },
  ];

  return (
    <div className="bg-[#121214] border border-[#27272a] rounded-lg p-2.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Canvas Alignment
        </span>
        <button
          onClick={() => align('center-both')}
          className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 text-[10px] transition-colors"
          title="Center Both Horizontally & Vertically"
        >
          <Crosshair className="w-3 h-3 text-amber-400" />
          <span>Center All</span>
        </button>
      </div>

      {/* Horizontal Alignment Group */}
      <div>
        <div className="text-[9px] text-zinc-500 mb-1">Horizontal</div>
        <div className="grid grid-cols-3 gap-1 bg-[#18181b] p-1 rounded-md border border-[#27272a]">
          {horizontalControls.map((ctrl) => {
            const Icon = ctrl.icon;
            return (
              <button
                key={ctrl.type}
                onClick={() => align(ctrl.type)}
                className="min-h-[32px] py-1 px-1 rounded flex items-center justify-center space-x-1 text-zinc-300 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
                title={ctrl.label}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-medium">{ctrl.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vertical Alignment Group */}
      <div>
        <div className="text-[9px] text-zinc-500 mb-1">Vertical</div>
        <div className="grid grid-cols-3 gap-1 bg-[#18181b] p-1 rounded-md border border-[#27272a]">
          {verticalControls.map((ctrl) => {
            const Icon = ctrl.icon;
            return (
              <button
                key={ctrl.type}
                onClick={() => align(ctrl.type)}
                className="min-h-[32px] py-1 px-1 rounded flex items-center justify-center space-x-1 text-zinc-300 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
                title={ctrl.label}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-medium">{ctrl.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
