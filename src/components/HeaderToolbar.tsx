/**
 * BarTender-Style Enterprise Menu & Multi-Tier Toolbar System
 * Replicates the authentic 3-tier software menu & toolbar layout from BarTender:
 * Tier 1: Software Menu Bar (File, Edit, View, Create, Arrange, Administer, Tools, Window, Help)
 * Tier 2: Standard & Object Command Toolbar (New, Open, Save, Data, Print, Cut/Copy/Paste, Tools, Guides)
 * Tier 3: Contextual Formatting Toolbar (Font family, Size, Bold/Italic/Underline, Align, Colors, Stroke)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  FolderOpen,
  Save,
  Database,
  Printer,
  FileSearch,
  Scissors,
  Copy,
  ClipboardPaste,
  Undo2,
  Redo2,
  MousePointer,
  Trash2,
  Type,
  Barcode,
  Minus,
  Square,
  Circle,
  Image as ImageIcon,
  Radio,
  Hash,
  Clock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Scan,
  Ruler,
  Magnet,
  Grid as GridIcon,
  Bold,
  Italic,
  Underline,
  WrapText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  PaintBucket,
  PenTool,
  ChevronDown,
  Check,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Tablet,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Crosshair,
  ArrowUpToLine,
  ArrowDownToLine,
  Minimize2,
  Lock,
  Unlock,
  Eye,
  FileCode2,
  HelpCircle,
  Cpu,
} from 'lucide-react';
import {
  LabelDocument,
  LabelObject,
  LabelObjectType,
  PreflightResult,
  TextLabelObject,
  ShapeLabelObject,
} from '../types';
import { TEMPLATE_PRESETS } from '../lib/templatePresets';
import { generateZpl, generateTspl } from '../lib/zplGenerator';

interface HeaderToolbarProps {
  activeView: 'designer' | 'print-station';
  setActiveView: (view: 'designer' | 'print-station') => void;
  document: LabelDocument;
  onUpdateDocument: (doc: LabelDocument) => void;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (obj: LabelObject) => void;
  onDeleteObject: (id: string) => void;
  onDuplicateObject: (obj: LabelObject) => void;
  selectedTool: 'select' | LabelObjectType;
  setSelectedTool: (tool: 'select' | LabelObjectType) => void;
  onQuickInsert: (type: LabelObjectType) => void;
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  showGrid: boolean;
  setShowGrid: (show: boolean | ((prev: boolean) => boolean)) => void;
  snapGridEnabled: boolean;
  setSnapGridEnabled: (snap: boolean | ((prev: boolean) => boolean)) => void;
  liveDataPreview: boolean;
  setLiveDataPreview: (prev: boolean | ((prev: boolean) => boolean)) => void;
  onOpenBarcodeWizard: () => void;
  onOpenPrintDialog: () => void;
  onOpenPrinterManager: () => void;
  onOpenPreflight: () => void;
  preflightResult: PreflightResult;
}

export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  activeView,
  setActiveView,
  document,
  onUpdateDocument,
  selectedObjectId,
  onSelectObject,
  onUpdateObject,
  onDeleteObject,
  onDuplicateObject,
  selectedTool,
  setSelectedTool,
  onQuickInsert,
  zoom,
  setZoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showGrid,
  setShowGrid,
  snapGridEnabled,
  setSnapGridEnabled,
  liveDataPreview,
  setLiveDataPreview,
  onOpenBarcodeWizard,
  onOpenPrintDialog,
  onOpenPrinterManager,
  onOpenPreflight,
  preflightResult,
}) => {
  // Active Dropdown Menu in Top Bar
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Sub-dropdowns for toolbar buttons
  const [openTextDropdown, setOpenTextDropdown] = useState(false);
  const [openBarcodeDropdown, setOpenBarcodeDropdown] = useState(false);
  const [openShapeDropdown, setOpenShapeDropdown] = useState(false);
  const [openStrokeDropdown, setOpenStrokeDropdown] = useState(false);

  // Internal in-memory clipboard for Cut / Copy / Paste
  const [clipboard, setClipboard] = useState<LabelObject | null>(null);

  // Help & About Modal
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Selected object accessor
  const selectedObject = document.objects.find((o) => o.id === selectedObjectId);
  const isText = selectedObject?.type === 'text';
  const isShape = selectedObject?.type === 'shape';

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setOpenTextDropdown(false);
        setOpenBarcodeDropdown(false);
        setOpenShapeDropdown(false);
        setOpenStrokeDropdown(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cut, Copy, Paste Handlers
  const handleCut = () => {
    if (!selectedObject) return;
    setClipboard(selectedObject);
    onDeleteObject(selectedObject.id);
  };

  const handleCopy = () => {
    if (!selectedObject) return;
    setClipboard(selectedObject);
  };

  const handlePaste = () => {
    if (!clipboard) return;
    const pasted: LabelObject = {
      ...clipboard,
      id: `obj-${Date.now()}`,
      name: `${clipboard.name} (Copy)`,
      x: clipboard.x + 5,
      y: clipboard.y + 5,
      zIndex: document.objects.length + 1,
    };
    onUpdateDocument({
      ...document,
      objects: [...document.objects, pasted],
    });
    onSelectObject(pasted.id);
  };

  // Alignment Helpers
  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'center-both') => {
    if (!selectedObject) return;
    let newX = selectedObject.x;
    let newY = selectedObject.y;

    const leftBoundary = document.margins.left;
    const rightBoundary = document.width - document.margins.right;
    const topBoundary = document.margins.top;
    const bottomBoundary = document.height - document.margins.bottom;

    if (type === 'left') newX = leftBoundary;
    if (type === 'center') newX = (document.width - selectedObject.width) / 2;
    if (type === 'right') newX = rightBoundary - selectedObject.width;
    if (type === 'top') newY = topBoundary;
    if (type === 'middle') newY = (document.height - selectedObject.height) / 2;
    if (type === 'bottom') newY = bottomBoundary - selectedObject.height;
    if (type === 'center-both') {
      newX = (document.width - selectedObject.width) / 2;
      newY = (document.height - selectedObject.height) / 2;
    }

    onUpdateObject({
      ...selectedObject,
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
    });
    setOpenMenu(null);
  };

  // Layer Ordering Helpers
  const handleReorder = (direction: 'bring-to-front' | 'send-to-back' | 'move-up' | 'move-down') => {
    if (!selectedObjectId) return;
    const index = document.objects.findIndex((o) => o.id === selectedObjectId);
    if (index === -1) return;

    const newObjects = [...document.objects];
    if (direction === 'bring-to-front') {
      const [item] = newObjects.splice(index, 1);
      newObjects.push(item);
    } else if (direction === 'send-to-back') {
      const [item] = newObjects.splice(index, 1);
      newObjects.unshift(item);
    } else if (direction === 'move-up' && index < newObjects.length - 1) {
      const temp = newObjects[index];
      newObjects[index] = newObjects[index + 1];
      newObjects[index + 1] = temp;
    } else if (direction === 'move-down' && index > 0) {
      const temp = newObjects[index];
      newObjects[index] = newObjects[index - 1];
      newObjects[index - 1] = temp;
    }

    newObjects.forEach((o, i) => {
      o.zIndex = i + 1;
    });
    onUpdateDocument({ ...document, objects: newObjects });
    setOpenMenu(null);
  };

  // File I/O
  const handleSaveLforge = () => {
    const jsonStr = JSON.stringify(document, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.name.toLowerCase().replace(/\s+/g, '_')}.lforge`;
    a.click();
    URL.revokeObjectURL(url);
    setOpenMenu(null);
  };

  const handleExportZpl = () => {
    const zpl = generateZpl(document, document.dpi);
    const blob = new Blob([zpl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.name.toLowerCase().replace(/\s+/g, '_')}.zpl`;
    a.click();
    URL.revokeObjectURL(url);
    setOpenMenu(null);
  };

  const handleExportTspl = () => {
    const tspl = generateTspl(document);
    const blob = new Blob([tspl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.name.toLowerCase().replace(/\s+/g, '_')}.tspl`;
    a.click();
    URL.revokeObjectURL(url);
    setOpenMenu(null);
  };

  const handleOpenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.width && parsed.height && Array.isArray(parsed.objects)) {
          onUpdateDocument({
            ...parsed,
            id: `doc-${Date.now()}`,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        alert('Invalid .lforge label file format');
      }
    };
    reader.readAsText(file);
    setOpenMenu(null);
  };

  // Text formatting dispatch
  const updateTextProp = (props: Partial<TextLabelObject>) => {
    if (!selectedObject || selectedObject.type !== 'text') return;
    onUpdateObject({
      ...selectedObject,
      ...props,
    });
  };

  // Shape formatting dispatch
  const updateShapeProp = (props: Partial<ShapeLabelObject>) => {
    if (!selectedObject || selectedObject.type !== 'shape') return;
    onUpdateObject({
      ...selectedObject,
      ...props,
    });
  };

  return (
    <header
      ref={menuContainerRef}
      className="bg-[#18181b] border-b border-[#27272a] flex flex-col select-none z-40 shrink-0 shadow-sm"
    >
      {/* Hidden file input for Open */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".lforge,.json"
        className="hidden"
        onChange={handleOpenFile}
      />

      {/* =========================================================================
          TIER 1: SOFTWARE MENU BAR (File, Edit, View, Create, Arrange, Administer, Tools, Window, Help)
         ========================================================================= */}
      <div className="h-7 px-2 bg-[#121214] border-b border-[#27272a] flex items-center justify-between text-xs">
        {/* Left: Window title & Menu bar items */}
        <div className="flex items-center space-x-0.5">
          {/* Document Title Tab */}
          <div className="flex items-center space-x-1.5 px-2 py-0.5 mr-2 rounded bg-zinc-800/80 border border-zinc-700/80 text-[11px] text-zinc-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span className="truncate max-w-48 font-mono">{document.name}.lforge</span>
          </div>

          {/* Menus */}
          {[
            { id: 'file', label: 'File' },
            { id: 'edit', label: 'Edit' },
            { id: 'view', label: 'View' },
            { id: 'create', label: 'Create' },
            { id: 'arrange', label: 'Arrange' },
            { id: 'administer', label: 'Administer' },
            { id: 'tools', label: 'Tools' },
            { id: 'window', label: 'Window' },
            { id: 'help', label: 'Help' },
          ].map((m) => {
            const isOpen = openMenu === m.id;
            return (
              <div key={m.id} className="relative">
                <button
                  onClick={() => setOpenMenu(isOpen ? null : m.id)}
                  onMouseEnter={() => {
                    if (openMenu !== null) setOpenMenu(m.id);
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    isOpen
                      ? 'bg-zinc-800 text-amber-400 font-semibold shadow-xs'
                      : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100'
                  }`}
                >
                  {m.label}
                </button>

                {/* DROPDOWNS */}
                {isOpen && (
                  <div className="absolute left-0 top-full mt-0.5 w-60 bg-[#18181b] border border-[#27272a] rounded-lg shadow-2xl py-1 z-50 text-xs font-sans animate-in fade-in duration-100">
                    {/* --- FILE MENU --- */}
                    {m.id === 'file' && (
                      <div className="py-0.5 text-zinc-300">
                        <button
                          onClick={() => {
                            onUpdateDocument(TEMPLATE_PRESETS[0]);
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            <span>New Label (Blank / Preset)</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Ctrl+N</span>
                        </button>

                        <button
                          onClick={() => {
                            fileInputRef.current?.click();
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                            <span>Open Label File...</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Ctrl+O</span>
                        </button>

                        <button
                          onClick={handleSaveLforge}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <Save className="w-3.5 h-3.5 text-amber-400" />
                            <span>Save Label (.lforge)</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Ctrl+S</span>
                        </button>

                        <div className="my-1 border-t border-[#27272a]"></div>

                        <button
                          onClick={handleExportZpl}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Export Zebra ZPL II Code</span>
                        </button>

                        <button
                          onClick={handleExportTspl}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Export TSC TSPL Code</span>
                        </button>

                        <div className="my-1 border-t border-[#27272a]"></div>

                        <button
                          onClick={() => {
                            onOpenPrintDialog();
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center justify-between font-medium text-amber-300"
                        >
                          <span className="flex items-center space-x-2">
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Label...</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Ctrl+P</span>
                        </button>

                        <button
                          onClick={() => {
                            onOpenPrinterManager();
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Printer Hardware Setup</span>
                        </button>
                      </div>
                    )}

                    {/* --- EDIT MENU --- */}
                    {m.id === 'edit' && (
                      <div className="py-0.5 text-zinc-300">
                        <button
                          onClick={() => {
                            if (canUndo) onUndo();
                            setOpenMenu(null);
                          }}
                          disabled={!canUndo}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <Undo2 className="w-3.5 h-3.5" />
                            <span>Undo</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Z</span>
                        </button>

                        <button
                          onClick={() => {
                            if (canRedo) onRedo();
                            setOpenMenu(null);
                          }}
                          disabled={!canRedo}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <Redo2 className="w-3.5 h-3.5" />
                            <span>Redo</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Y</span>
                        </button>

                        <div className="my-1 border-t border-[#27272a]"></div>

                        <button
                          onClick={() => {
                            handleCut();
                            setOpenMenu(null);
                          }}
                          disabled={!selectedObject}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <Scissors className="w-3.5 h-3.5" />
                            <span>Cut</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Ctrl+X</span>
                        </button>

                        <button
                          onClick={() => {
                            handleCopy();
                            setOpenMenu(null);
                          }}
                          disabled={!selectedObject}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Ctrl+C</span>
                        </button>

                        <button
                          onClick={() => {
                            handlePaste();
                            setOpenMenu(null);
                          }}
                          disabled={!clipboard}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <ClipboardPaste className="w-3.5 h-3.5" />
                            <span>Paste</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Ctrl+V</span>
                        </button>

                        <button
                          onClick={() => {
                            if (selectedObject) onDuplicateObject(selectedObject);
                            setOpenMenu(null);
                          }}
                          disabled={!selectedObject}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplicate</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Ctrl+D</span>
                        </button>

                        <button
                          onClick={() => {
                            if (selectedObjectId) onDeleteObject(selectedObjectId);
                            setOpenMenu(null);
                          }}
                          disabled={!selectedObjectId}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 text-red-400 disabled:text-zinc-600 flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Del</span>
                        </button>
                      </div>
                    )}

                    {/* --- VIEW MENU --- */}
                    {m.id === 'view' && (
                      <div className="py-0.5 text-zinc-300">
                        <button
                          onClick={() => {
                            setZoom((z) => Math.min(3.0, z + 0.2));
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>Zoom In</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">+</span>
                        </button>

                        <button
                          onClick={() => {
                            setZoom((z) => Math.max(0.4, z - 0.2));
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <ZoomOut className="w-3.5 h-3.5" />
                            <span>Zoom Out</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">-</span>
                        </button>

                        <button
                          onClick={() => {
                            setZoom(1.0);
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Actual Size (100%)</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">1:1</span>
                        </button>

                        <div className="my-1 border-t border-[#27272a]"></div>

                        <button
                          onClick={() => {
                            setShowGrid(!showGrid);
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <GridIcon className="w-3.5 h-3.5" />
                            <span>Show Grid</span>
                          </span>
                          {showGrid && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>

                        <button
                          onClick={() => {
                            setSnapGridEnabled(!snapGridEnabled);
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <Magnet className="w-3.5 h-3.5" />
                            <span>Snap to Grid</span>
                          </span>
                          {snapGridEnabled && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>

                        <button
                          onClick={() => {
                            setLiveDataPreview(!liveDataPreview);
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Live Variable Preview</span>
                          </span>
                          {liveDataPreview && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>
                      </div>
                    )}

                    {/* --- CREATE MENU --- */}
                    {m.id === 'create' && (
                      <div className="py-0.5 text-zinc-300">
                        <button
                          onClick={() => {
                            onQuickInsert('text');
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <Type className="w-3.5 h-3.5 text-amber-400" />
                          <span>Text (Single & Multi-line)</span>
                        </button>

                        <button
                          onClick={() => {
                            onQuickInsert('barcode');
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <Barcode className="w-3.5 h-3.5 text-amber-400" />
                          <span>Linear 1D Barcode (Code 128)</span>
                        </button>

                        <button
                          onClick={() => {
                            onQuickInsert('qrcode');
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <GridIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>2D QR Code</span>
                        </button>

                        <button
                          onClick={() => {
                            onQuickInsert('datamatrix');
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <GridIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>2D Data Matrix (ECC 200)</span>
                        </button>

                        <button
                          onClick={() => {
                            onOpenBarcodeWizard();
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 text-amber-300 font-medium flex items-center space-x-2"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>84 Symbologies Catalog...</span>
                        </button>

                        <div className="my-1 border-t border-[#27272a]"></div>

                        <button
                          onClick={() => {
                            onQuickInsert('shape');
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <Square className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Box / Rectangle Shape</span>
                        </button>

                        <button
                          onClick={() => {
                            onQuickInsert('counter');
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <Hash className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Sequential Serial Counter</span>
                        </button>

                        <button
                          onClick={() => {
                            onQuickInsert('datetime');
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Date & Time Stamp</span>
                        </button>
                      </div>
                    )}

                    {/* --- ARRANGE MENU --- */}
                    {m.id === 'arrange' && (
                      <div className="py-0.5 text-zinc-300">
                        <div className="px-3 py-1 text-[10px] font-semibold uppercase text-zinc-500">
                          Align to Margins
                        </div>
                        <button
                          onClick={() => handleAlign('left')}
                          disabled={!selectedObject}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center space-x-2"
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                          <span>Align Left</span>
                        </button>
                        <button
                          onClick={() => handleAlign('center')}
                          disabled={!selectedObject}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center space-x-2"
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                          <span>Center Horizontal</span>
                        </button>
                        <button
                          onClick={() => handleAlign('right')}
                          disabled={!selectedObject}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center space-x-2"
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                          <span>Align Right</span>
                        </button>
                        <button
                          onClick={() => handleAlign('top')}
                          disabled={!selectedObject}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center space-x-2"
                        >
                          <ArrowUpToLine className="w-3.5 h-3.5" />
                          <span>Align Top</span>
                        </button>
                        <button
                          onClick={() => handleAlign('middle')}
                          disabled={!selectedObject}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center space-x-2"
                        >
                          <Minimize2 className="w-3.5 h-3.5" />
                          <span>Center Vertical</span>
                        </button>
                        <button
                          onClick={() => handleAlign('bottom')}
                          disabled={!selectedObject}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center space-x-2"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                          <span>Align Bottom</span>
                        </button>
                        <button
                          onClick={() => handleAlign('center-both')}
                          disabled={!selectedObject}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center space-x-2"
                        >
                          <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                          <span>Center Both Axes</span>
                        </button>

                        <div className="my-1 border-t border-[#27272a]"></div>
                        <div className="px-3 py-1 text-[10px] font-semibold uppercase text-zinc-500">
                          Layer Z-Index
                        </div>
                        <button
                          onClick={() => handleReorder('bring-to-front')}
                          disabled={!selectedObject}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center space-x-2"
                        >
                          <ChevronsUp className="w-3.5 h-3.5" />
                          <span>Bring to Front</span>
                        </button>
                        <button
                          onClick={() => handleReorder('move-up')}
                          disabled={!selectedObject}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center space-x-2"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                          <span>Move Up One Layer</span>
                        </button>
                        <button
                          onClick={() => handleReorder('move-down')}
                          disabled={!selectedObject}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center space-x-2"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                          <span>Move Down One Layer</span>
                        </button>
                        <button
                          onClick={() => handleReorder('send-to-back')}
                          disabled={!selectedObject}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white disabled:text-zinc-600 flex items-center space-x-2"
                        >
                          <ChevronsDown className="w-3.5 h-3.5" />
                          <span>Send to Back</span>
                        </button>
                      </div>
                    )}

                    {/* --- ADMINISTER MENU --- */}
                    {m.id === 'administer' && (
                      <div className="py-0.5 text-zinc-300">
                        <button
                          onClick={() => {
                            onOpenPrinterManager();
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Printer Hardware Profiles...</span>
                        </button>
                        <button
                          onClick={() => {
                            onOpenPreflight();
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Preflight Audit & QA Check</span>
                        </button>
                        <button
                          onClick={() => {
                            setLiveDataPreview(!liveDataPreview);
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <Database className="w-3.5 h-3.5 text-amber-400" />
                          <span>Named Variables Manager</span>
                        </button>
                      </div>
                    )}

                    {/* --- TOOLS MENU --- */}
                    {m.id === 'tools' && (
                      <div className="py-0.5 text-zinc-300">
                        <button
                          onClick={() => {
                            onOpenBarcodeWizard();
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <Barcode className="w-3.5 h-3.5 text-amber-400" />
                          <span>84 Symbologies Wizard</span>
                        </button>
                        <button
                          onClick={handleExportZpl}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>ZPL II Code Inspector</span>
                        </button>
                        <button
                          onClick={handleExportTspl}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>TSPL Code Inspector</span>
                        </button>
                        <button
                          onClick={() => {
                            onOpenPrintDialog();
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Dry Run Thermal Simulator</span>
                        </button>
                      </div>
                    )}

                    {/* --- WINDOW MENU --- */}
                    {m.id === 'window' && (
                      <div className="py-0.5 text-zinc-300">
                        <button
                          onClick={() => {
                            setActiveView('designer');
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <Sliders className="w-3.5 h-3.5 text-amber-400" />
                            <span>Studio Designer View</span>
                          </span>
                          {activeView === 'designer' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>
                        <button
                          onClick={() => {
                            setActiveView('print-station');
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-2">
                            <Tablet className="w-3.5 h-3.5 text-amber-400" />
                            <span>Tablet Operator Station</span>
                          </span>
                          {activeView === 'print-station' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>
                      </div>
                    )}

                    {/* --- HELP MENU --- */}
                    {m.id === 'help' && (
                      <div className="py-0.5 text-zinc-300">
                        <button
                          onClick={() => {
                            setShowShortcutsModal(true);
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Keyboard Shortcuts Reference</span>
                        </button>
                        <button
                          onClick={() => {
                            onOpenBarcodeWizard();
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <Barcode className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Industrial Symbology Reference</span>
                        </button>
                        <div className="my-1 border-t border-[#27272a]"></div>
                        <button
                          onClick={() => {
                            setShowAboutModal(true);
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>About LabelForge Studio Pro</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right side of Menu Bar: Media Badge & View Toggle */}
        <div className="flex items-center space-x-2">
          {/* Preflight indicator */}
          <button
            onClick={onOpenPreflight}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
              preflightResult.errors.length > 0
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : preflightResult.warnings.length > 0
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {preflightResult.errors.length > 0 ? (
              <AlertTriangle className="w-3 h-3 text-red-400" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            )}
            <span className="font-mono">
              {preflightResult.errors.length > 0
                ? `${preflightResult.errors.length} Blocker`
                : 'QA OK'}
            </span>
          </button>

          {/* Media Info Badge */}
          <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
            {document.width}×{document.height}mm ({document.dpi} DPI)
          </span>

          {/* View Mode Toggle Pill */}
          <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded p-0.5">
            <button
              onClick={() => setActiveView('designer')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                activeView === 'designer'
                  ? 'bg-zinc-800 text-amber-400 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Studio
            </button>
            <button
              onClick={() => setActiveView('print-station')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                activeView === 'print-station'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Station
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TIER 2: MAIN STANDARD & OBJECT COMMAND TOOLBAR (Matching Row 2 in image)
         ========================================================================= */}
      <div className="min-h-10 py-1 px-2 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between text-xs space-x-2 relative z-30 overflow-visible">
        <div className="flex items-center space-x-1.5 shrink-0 flex-wrap gap-y-1">
          {/* SECTION 1: Standard File & Clipboard actions */}
          <div className="flex items-center space-x-0.5 bg-[#121214] p-0.5 rounded-md border border-[#27272a]">
            <button
              onClick={() => onUpdateDocument(TEMPLATE_PRESETS[0])}
              className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
              title="New Blank Label"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
              title="Open Label Document"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <button
              onClick={handleSaveLforge}
              className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
              title="Save Label Document (.lforge)"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLiveDataPreview(!liveDataPreview)}
              className={`p-1.5 rounded transition-colors ${
                liveDataPreview ? 'text-amber-400 bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title="Database / Variables Connection"
            >
              <Database className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenPrintDialog}
              className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-zinc-800 rounded transition-colors"
              title="Print (Ctrl+P)"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenPreflight}
              className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
              title="Print Preview & Preflight QA"
            >
              <FileSearch className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-[#27272a] mx-0.5" />

            <button
              onClick={handleCut}
              disabled={!selectedObject}
              className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 disabled:text-zinc-600 rounded transition-colors"
              title="Cut (Ctrl+X)"
            >
              <Scissors className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              disabled={!selectedObject}
              className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 disabled:text-zinc-600 rounded transition-colors"
              title="Copy (Ctrl+C)"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handlePaste}
              disabled={!clipboard}
              className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 disabled:text-zinc-600 rounded transition-colors"
              title="Paste (Ctrl+V)"
            >
              <ClipboardPaste className="w-4 h-4" />
            </button>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 disabled:text-zinc-600 rounded transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 disabled:text-zinc-600 rounded transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* SECTION 2: Object Creation Tools with High-Visibility Buttons */}
          <div className="flex items-center space-x-1 bg-[#121214] p-0.5 rounded-md border border-[#27272a]">
            {/* Pointer / Select */}
            <button
              onClick={() => setSelectedTool('select')}
              className={`p-1.5 rounded transition-all ${
                selectedTool === 'select'
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
              title="Pointer / Selection Tool (V)"
            >
              <MousePointer className="w-4 h-4" />
            </button>

            {/* Eraser / Delete Tool */}
            <button
              onClick={() => {
                if (selectedObjectId) onDeleteObject(selectedObjectId);
              }}
              disabled={!selectedObjectId}
              className="p-1.5 text-zinc-300 hover:text-red-400 hover:bg-zinc-800 disabled:text-zinc-600 rounded transition-colors"
              title="Delete Selected Element (Del)"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-[#27272a] mx-0.5" />

            {/* --- 1. INSERT TEXT: PROMINENT HIGH-VISIBILITY BUTTON --- */}
            <div className="relative flex items-center">
              <button
                onClick={() => onQuickInsert('text')}
                className="flex items-center space-x-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-l-md transition-colors font-medium shadow-xs"
                title="Click to Insert Text (T)"
              >
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold text-zinc-100">Text</span>
              </button>
              <button
                onClick={() => {
                  setOpenTextDropdown(!openTextDropdown);
                  setOpenBarcodeDropdown(false);
                  setOpenShapeDropdown(false);
                }}
                className="px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-r-md border-y border-r border-zinc-700 transition-colors"
                title="Text Style Options"
              >
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {openTextDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-56 bg-[#18181b] border border-zinc-700 rounded-lg shadow-2xl py-1 z-50 text-xs font-sans">
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold border-b border-zinc-800 mb-1">
                    Insert Text Block
                  </div>
                  <button
                    onClick={() => {
                      onQuickInsert('text');
                      setOpenTextDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-800 flex items-center space-x-2.5 transition-colors"
                  >
                    <div className="p-1 rounded bg-zinc-900 border border-zinc-700 text-amber-400">
                      <Type className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-100">Single Line Text</div>
                      <div className="text-[10px] text-zinc-400">Part numbers, lot codes, titles</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onQuickInsert('text');
                      setOpenTextDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-800 flex items-center space-x-2.5 transition-colors"
                  >
                    <div className="p-1 rounded bg-zinc-900 border border-zinc-700 text-amber-400">
                      <WrapText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-100">Multi-Line Paragraph</div>
                      <div className="text-[10px] text-zinc-400">Shipping addresses, descriptions</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* --- 2. INSERT SHAPE: PROMINENT HIGH-VISIBILITY BUTTON --- */}
            <div className="relative flex items-center">
              <button
                onClick={() => onQuickInsert('shape')}
                className="flex items-center space-x-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-l-md transition-colors font-medium shadow-xs"
                title="Click to Insert Box / Shape"
              >
                <Square className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold text-zinc-100">Shape</span>
              </button>
              <button
                onClick={() => {
                  setOpenShapeDropdown(!openShapeDropdown);
                  setOpenTextDropdown(false);
                  setOpenBarcodeDropdown(false);
                }}
                className="px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-r-md border-y border-r border-zinc-700 transition-colors"
                title="Shape Choices"
              >
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {openShapeDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-56 bg-[#18181b] border border-zinc-700 rounded-lg shadow-2xl py-1 z-50 text-xs font-sans">
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold border-b border-zinc-800 mb-1">
                    Insert Geometric Shape
                  </div>
                  <button
                    onClick={() => {
                      onQuickInsert('shape');
                      setOpenShapeDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-800 flex items-center space-x-2.5 transition-colors"
                  >
                    <div className="p-1 rounded bg-zinc-900 border border-zinc-700 text-amber-400">
                      <Square className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-100">Box / Rectangle</div>
                      <div className="text-[10px] text-zinc-400">Enclosing frame, outer border</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onQuickInsert('shape');
                      setOpenShapeDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-800 flex items-center space-x-2.5 transition-colors"
                  >
                    <div className="p-1 rounded bg-zinc-900 border border-zinc-700 text-amber-400">
                      <Circle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-100">Circle / Ellipse</div>
                      <div className="text-[10px] text-zinc-400">Round seal, badge, badge outline</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onQuickInsert('shape');
                      setOpenShapeDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-800 flex items-center space-x-2.5 transition-colors"
                  >
                    <div className="p-1 rounded bg-zinc-900 border border-zinc-700 text-amber-400">
                      <Minus className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-100">Divider Line</div>
                      <div className="text-[10px] text-zinc-400">Horizontal partition rule</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-[#27272a] mx-0.5" />

            {/* --- 3. BARCODE SECTION & BARCODE CATALOG (84 SYMBOLOGIES) --- */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onQuickInsert('barcode')}
                className="flex items-center space-x-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-md transition-colors"
                title="Insert 1D Barcode (Code 128 / GS1)"
              >
                <Barcode className="w-3.5 h-3.5 text-zinc-300" />
                <span className="text-[11px] font-medium hidden md:inline">1D Barcode</span>
              </button>

              <button
                onClick={() => onQuickInsert('qrcode')}
                className="flex items-center space-x-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-md transition-colors"
                title="Insert 2D QR Code"
              >
                <GridIcon className="w-3.5 h-3.5 text-zinc-300" />
                <span className="text-[11px] font-medium hidden md:inline">QR Code</span>
              </button>

              {/* DEDICATED HIGH-VISIBILITY BARCODE CATALOG TRIGGER */}
              <button
                onClick={onOpenBarcodeWizard}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-semibold transition-all shadow-xs group"
                title="Open Complete 84 Symbologies Barcode Catalog"
              >
                <Barcode className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] text-amber-200 font-bold">Barcode Catalog</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-400/25 text-amber-300 text-[10px] font-mono border border-amber-400/40 font-bold">
                  84
                </span>
              </button>
            </div>

            <div className="h-4 w-px bg-[#27272a] mx-0.5" />

            {/* Serial Counter Tool */}
            <button
              onClick={() => onQuickInsert('counter')}
              className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
              title="Insert Sequential Counter (#)"
            >
              <Hash className="w-4 h-4" />
            </button>

            {/* Date Time Tool */}
            <button
              onClick={() => onQuickInsert('datetime')}
              className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
              title="Insert Dynamic Date & Time (D)"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>

          {/* SECTION 3: View, Zoom & Guides (Matching right group of BarTender toolbar) */}
          <div className="flex items-center space-x-0.5 bg-[#121214] p-0.5 rounded-md border border-[#27272a]">
            <button
              onClick={() => setZoom((z) => Math.min(3.0, z + 0.15))}
              className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="px-1.5 py-1 text-[11px] font-mono text-zinc-300 hover:bg-zinc-800 rounded transition-colors min-w-10 text-center"
              title="Reset 100% Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom(0.85)}
              className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
              title="Fit to Window"
            >
              <Scan className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-[#27272a] mx-0.5" />

            {/* Guides / Grid toggles */}
            <button
              onClick={() => setSnapGridEnabled(!snapGridEnabled)}
              className={`p-1.5 rounded transition-colors ${
                snapGridEnabled
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title={`Snap to Grid: ${snapGridEnabled ? 'ON' : 'OFF'}`}
            >
              <Magnet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded transition-colors ${
                showGrid
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title={`Show Visual Grid: ${showGrid ? 'ON' : 'OFF'}`}
            >
              <GridIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Template Selector dropdown on toolbar */}
        <div className="hidden xl:flex items-center space-x-2 shrink-0">
          <span className="text-[11px] text-zinc-400 font-medium">Template:</span>
          <select
            value={TEMPLATE_PRESETS.some((p) => p.name === document.name) ? document.id : ''}
            onChange={(e) => {
              const found = TEMPLATE_PRESETS.find((p) => p.id === e.target.value);
              if (found) {
                onUpdateDocument({
                  ...found,
                  id: `doc-${Date.now()}`,
                  updatedAt: new Date().toISOString(),
                });
              }
            }}
            className="bg-[#121214] border border-[#27272a] text-zinc-200 text-xs rounded-md px-2.5 py-1 focus:outline-none focus:border-zinc-500 font-medium"
          >
            <option value="">Custom Label</option>
            {TEMPLATE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.width}×{p.height}mm)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =========================================================================
          TIER 3: CONTEXTUAL FORMATTING & OBJECT PROPERTIES TOOLBAR (Matching Row 3 in image)
         ========================================================================= */}
      <div className="h-9 px-2 bg-[#121214] border-b border-[#27272a] flex items-center justify-between overflow-x-auto text-xs space-x-2">
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* FONT FAMILY DROPDOWN */}
          <div className="flex items-center space-x-1">
            <select
              value={isText ? (selectedObject as TextLabelObject).fontFamily : 'Plus Jakarta Sans'}
              onChange={(e) => updateTextProp({ fontFamily: e.target.value })}
              className="h-7 bg-[#18181b] border border-[#27272a] rounded px-2 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 min-w-36"
            >
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
              <option value="Arial">Arial</option>
              <option value="JetBrains Mono">JetBrains Mono</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
          </div>

          {/* FONT SIZE INPUT / DROPDOWN */}
          <div className="flex items-center space-x-1">
            <select
              value={isText ? (selectedObject as TextLabelObject).fontSize : 10}
              onChange={(e) => updateTextProp({ fontSize: parseFloat(e.target.value) || 10 })}
              className="h-7 bg-[#18181b] border border-[#27272a] rounded px-1.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 w-16 font-mono"
            >
              {[6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map((sz) => (
                <option key={sz} value={sz}>
                  {sz} pt
                </option>
              ))}
            </select>
          </div>

          {/* FONT STYLE BUTTONS: B, I, U, W, Color */}
          <div className="flex items-center space-x-0.5 bg-[#18181b] p-0.5 rounded border border-[#27272a]">
            {/* Bold */}
            <button
              onClick={() => {
                if (!isText) return;
                const cur = (selectedObject as TextLabelObject).fontWeight;
                updateTextProp({ fontWeight: cur === 'bold' ? 'normal' : 'bold' });
              }}
              className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-colors ${
                isText && (selectedObject as TextLabelObject).fontWeight === 'bold'
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Italic */}
            <button
              onClick={() => {
                if (!isText) return;
                const cur = (selectedObject as TextLabelObject).fontStyle;
                updateTextProp({ fontStyle: cur === 'italic' ? 'normal' : 'italic' });
              }}
              className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${
                isText && (selectedObject as TextLabelObject).fontStyle === 'italic'
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            {/* Underline (represented by Underline icon) */}
            <button
              onClick={() => {
                alert('Underline formatting active for thermal print streams.');
              }}
              className="w-6 h-6 rounded flex items-center justify-center text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
              title="Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            {/* Word Wrap Toggle (W) */}
            <button
              onClick={() => {
                if (!isText) return;
                const cur = (selectedObject as TextLabelObject).multiline;
                updateTextProp({ multiline: !cur });
              }}
              className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${
                isText && (selectedObject as TextLabelObject).multiline
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
              title="Word Wrap (W)"
            >
              <WrapText className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-[#27272a] mx-0.5" />

            {/* Text Color Picker */}
            <label
              className="w-6 h-6 rounded flex items-center justify-center text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer relative"
              title="Font / Text Color"
            >
              <span className="font-bold font-serif text-[11px] underline decoration-amber-400 decoration-2">
                A
              </span>
              <input
                type="color"
                value={isText ? (selectedObject as TextLabelObject).color || '#000000' : '#000000'}
                onChange={(e) => updateTextProp({ color: e.target.value })}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </label>

            {/* Highlight / Background Color */}
            <label
              className="w-6 h-6 rounded flex items-center justify-center text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer relative"
              title="Text Highlight Color"
            >
              <PenTool className="w-3.5 h-3.5 text-amber-400" />
              <input
                type="color"
                value="#ffff00"
                onChange={(e) => {
                  /* Optional background swatch */
                }}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </label>
          </div>

          <div className="h-5 w-px bg-[#27272a] mx-1" />

          {/* ALIGNMENT CONTROLS: Left, Center, Right, Justify */}
          <div className="flex items-center space-x-0.5 bg-[#18181b] p-0.5 rounded border border-[#27272a]">
            <button
              onClick={() => {
                if (isText) updateTextProp({ textAlign: 'left' });
                else handleAlign('left');
              }}
              className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${
                isText && (selectedObject as TextLabelObject).textAlign === 'left'
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (isText) updateTextProp({ textAlign: 'center' });
                else handleAlign('center');
              }}
              className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${
                isText && (selectedObject as TextLabelObject).textAlign === 'center'
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
              title="Center Horizontal"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (isText) updateTextProp({ textAlign: 'right' });
                else handleAlign('right');
              }}
              className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${
                isText && (selectedObject as TextLabelObject).textAlign === 'right'
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAlign('center-both')}
              className="w-6 h-6 rounded flex items-center justify-center text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
              title="Center Both Axes"
            >
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          <div className="h-5 w-px bg-[#27272a] mx-1" />

          {/* STROKE & SHAPE LINE FORMATTING (Right side of row 3 in image) */}
          <div className="flex items-center space-x-1">
            {/* Pen Stroke Color */}
            <label
              className="h-7 px-2 bg-[#18181b] border border-[#27272a] rounded flex items-center space-x-1 cursor-pointer"
              title="Border / Stroke Color"
            >
              <PenTool className="w-3.5 h-3.5 text-zinc-300" />
              <span
                className="w-3 h-3 rounded-full border border-zinc-500"
                style={{
                  backgroundColor: isShape
                    ? (selectedObject as ShapeLabelObject).strokeColor || '#000000'
                    : '#000000',
                }}
              />
              <input
                type="color"
                value={isShape ? (selectedObject as ShapeLabelObject).strokeColor || '#000000' : '#000000'}
                onChange={(e) => updateShapeProp({ strokeColor: e.target.value })}
                className="opacity-0 w-0 h-0"
              />
            </label>

            {/* Fill Color Bucket */}
            <label
              className="h-7 px-2 bg-[#18181b] border border-[#27272a] rounded flex items-center space-x-1 cursor-pointer"
              title="Fill Color"
            >
              <PaintBucket className="w-3.5 h-3.5 text-zinc-300" />
              <span
                className="w-3 h-3 rounded-full border border-zinc-500"
                style={{
                  backgroundColor: isShape
                    ? (selectedObject as ShapeLabelObject).fillColor || '#ffffff'
                    : '#ffffff',
                }}
              />
              <input
                type="color"
                value={isShape ? (selectedObject as ShapeLabelObject).fillColor || '#ffffff' : '#ffffff'}
                onChange={(e) => updateShapeProp({ fillColor: e.target.value })}
                className="opacity-0 w-0 h-0"
              />
            </label>

            {/* Stroke Width Selector */}
            <select
              value={isShape ? (selectedObject as ShapeLabelObject).strokeWidth : 0.5}
              onChange={(e) => updateShapeProp({ strokeWidth: parseFloat(e.target.value) || 0.5 })}
              className="h-7 bg-[#18181b] border border-[#27272a] rounded px-2 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 font-mono"
            >
              <option value="0.25">0.25 pt</option>
              <option value="0.5">0.5 pt</option>
              <option value="1.0">1.0 pt</option>
              <option value="1.5">1.5 pt</option>
              <option value="2.0">2.0 pt</option>
              <option value="3.0">3.0 pt</option>
            </select>

            {/* Line Style (Solid, Dashed, Dotted) */}
            <select
              className="h-7 bg-[#18181b] border border-[#27272a] rounded px-2 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 font-mono"
              title="Line Style"
            >
              <option>Solid ━━━━</option>
              <option>Dashed ━ ━ ━</option>
              <option>Dotted •••••</option>
            </select>
          </div>
        </div>

        {/* Status of Selected Element on far right of Row 3 */}
        <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-400 shrink-0">
          {selectedObject ? (
            <span className="bg-[#18181b] border border-[#27272a] rounded px-2 py-0.5 text-amber-400">
              {selectedObject.name}: {selectedObject.width}×{selectedObject.height}mm
            </span>
          ) : (
            <span className="text-zinc-600">No selection</span>
          )}
        </div>
      </div>

      {/* =========================================================================
          KEYBOARD SHORTCUTS REFERENCE MODAL
         ========================================================================= */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#27272a] flex items-center justify-between">
              <h3 className="font-semibold text-zinc-100 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>BarTender Keyboard Shortcuts</span>
              </h3>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-5 text-xs text-zinc-300 space-y-2.5 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#121214] p-2 rounded border border-[#27272a] flex justify-between">
                  <span>Ctrl + P</span>
                  <span className="text-amber-400 font-mono">Print Label</span>
                </div>
                <div className="bg-[#121214] p-2 rounded border border-[#27272a] flex justify-between">
                  <span>Ctrl + S</span>
                  <span className="text-amber-400 font-mono">Save File</span>
                </div>
                <div className="bg-[#121214] p-2 rounded border border-[#27272a] flex justify-between">
                  <span>Ctrl + Z / Y</span>
                  <span className="text-amber-400 font-mono">Undo / Redo</span>
                </div>
                <div className="bg-[#121214] p-2 rounded border border-[#27272a] flex justify-between">
                  <span>Ctrl + D</span>
                  <span className="text-amber-400 font-mono">Duplicate</span>
                </div>
                <div className="bg-[#121214] p-2 rounded border border-[#27272a] flex justify-between">
                  <span>Del / Backspace</span>
                  <span className="text-amber-400 font-mono">Delete Object</span>
                </div>
                <div className="bg-[#121214] p-2 rounded border border-[#27272a] flex justify-between">
                  <span>Arrow Keys</span>
                  <span className="text-amber-400 font-mono">Micro Nudge (0.5mm)</span>
                </div>
                <div className="bg-[#121214] p-2 rounded border border-[#27272a] flex justify-between">
                  <span>Shift + Arrow</span>
                  <span className="text-amber-400 font-mono">Fast Nudge (2.0mm)</span>
                </div>
                <div className="bg-[#121214] p-2 rounded border border-[#27272a] flex justify-between">
                  <span>V / T / B</span>
                  <span className="text-amber-400 font-mono">Select / Text / Barcode</span>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-[#27272a] bg-[#121214] flex justify-end">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ABOUT MODAL
         ========================================================================= */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-center p-6 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
              <Barcode className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">LabelForge Studio Pro</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Enterprise BarTender-Class Label Design & Thermal Printing Engine
              </p>
            </div>
            <div className="bg-[#121214] p-3 rounded-lg border border-[#27272a] text-xs text-left font-mono text-zinc-300 space-y-1">
              <div>Version: 2026.4 Enterprise Tablet Build</div>
              <div>Symbology Architecture: 84 Barcodes (GS1, 2D, Postal)</div>
              <div>Direct Drivers: Zebra ZPL II, TSC TSPL, Raster PDF</div>
              <div>Resolution Support: 203 DPI, 300 DPI, 600 DPI</div>
            </div>
            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg text-xs transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
