/**
 * LabelForge Platform - Master Studio Application
 * Independent enterprise label design & printing engine with dark grey theme.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LabelDocument,
  LabelObject,
  LabelObjectType,
  PrinterProfile,
  PrintJobRecord,
  BarcodeSymbologyDefinition,
} from './types';
import { TEMPLATE_PRESETS } from './lib/templatePresets';
import { HeaderToolbar } from './components/HeaderToolbar';
import { Toolbox } from './components/Toolbox';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { BarcodeWizardModal } from './components/BarcodeWizardModal';
import { PrintDialogModal } from './components/PrintDialogModal';
import { PrintStationView } from './components/PrintStationView';
import { PrinterManagerModal } from './components/PrinterManagerModal';
import { PreflightModal } from './components/PreflightModal';
import { runPreflight } from './lib/preflight';

const INITIAL_PRINTERS: PrinterProfile[] = [
  {
    id: 'ptr-zebra-zt411',
    name: 'Zebra ZT411 Industrial (Warehouse)',
    manufacturer: 'Zebra',
    model: 'ZT411',
    dpi: 203,
    language: 'ZPL',
    connection: 'TCP/IP',
    address: '192.168.1.140:9100',
    status: 'online',
    isDefault: true,
    maxPrintWidthMm: 104,
  },
  {
    id: 'ptr-zebra-zd621',
    name: 'Zebra ZD621 Desktop (Cleanroom / QA)',
    manufacturer: 'Zebra',
    model: 'ZD621',
    dpi: 300,
    language: 'ZPL',
    connection: 'USB',
    address: 'USB001',
    status: 'online',
    isDefault: false,
    maxPrintWidthMm: 104,
  },
  {
    id: 'ptr-tsc-ttp244',
    name: 'TSC TTP-244 Pro (Packaging Line 2)',
    manufacturer: 'TSC',
    model: 'TTP-244 Pro',
    dpi: 203,
    language: 'TSPL',
    connection: 'TCP/IP',
    address: '192.168.1.145:9100',
    status: 'online',
    isDefault: false,
    maxPrintWidthMm: 108,
  },
  {
    id: 'ptr-browser-spooler',
    name: 'Windows / Android Print Spooler (PDF)',
    manufacturer: 'Generic',
    model: 'Virtual Spooler',
    dpi: 300,
    language: 'RASTER',
    connection: 'Windows Spooler',
    address: 'LOCAL_DEFAULT',
    status: 'online',
    isDefault: false,
    maxPrintWidthMm: 210,
  },
];

export default function App() {
  // Document State with Undo/Redo history
  const [doc, setDoc] = useState<LabelDocument>(TEMPLATE_PRESETS[0]);
  const [history, setHistory] = useState<LabelDocument[]>([TEMPLATE_PRESETS[0]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // View state: Studio Designer vs Tablet Operator Print Station
  const [activeView, setActiveView] = useState<'designer' | 'print-station'>('designer');

  // Canvas & Tools state
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<'select' | LabelObjectType>('select');
  const [zoom, setZoom] = useState(1.0);
  const [showGrid, setShowGrid] = useState(true);
  const [snapGridEnabled, setSnapGridEnabled] = useState(true);
  const [gridStepMm, setGridStepMm] = useState(2.0);
  const [liveDataPreview, setLiveDataPreview] = useState(false);

  // Hardware Printers
  const [printers, setPrinters] = useState<PrinterProfile[]>(INITIAL_PRINTERS);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>(INITIAL_PRINTERS[0].id);

  // Print History Log
  const [printHistory, setPrintHistory] = useState<PrintJobRecord[]>([
    {
      id: 'job-901',
      timestamp: 'Today 08:15',
      templateName: 'GS1 Logistics Pallet Label',
      printerName: 'Zebra ZT411 Industrial',
      copies: 12,
      batchCount: 12,
      status: 'COMPLETED',
      strategy: 'ZPL',
    },
  ]);

  // Modal Dialogs
  const [isBarcodeWizardOpen, setIsBarcodeWizardOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrinterManagerOpen, setIsPrinterManagerOpen] = useState(false);
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);

  // Preflight QA check
  const preflightResult = runPreflight(doc);

  // Update Document with Undo/Redo Record
  const updateDocumentWithHistory = useCallback((newDoc: LabelDocument, recordHistory = true) => {
    setDoc(newDoc);
    if (recordHistory) {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newDoc];
      });
      setHistoryIndex((prev) => prev + 1);
    }
  }, [historyIndex]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setDoc(history[newIdx]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setDoc(history[newIdx]);
    }
  }, [historyIndex, history]);

  // Object level updates
  const handleUpdateObject = (updatedObj: LabelObject) => {
    const newObjects = doc.objects.map((o) => (o.id === updatedObj.id ? updatedObj : o));
    updateDocumentWithHistory({ ...doc, objects: newObjects }, true);
  };

  const handleDuplicateObject = (obj: LabelObject) => {
    const duplicated: LabelObject = {
      ...obj,
      id: `obj-${Date.now()}`,
      name: `${obj.name} (Copy)`,
      x: obj.x + 4,
      y: obj.y + 4,
      zIndex: doc.objects.length + 1,
    };
    updateDocumentWithHistory({ ...doc, objects: [...doc.objects, duplicated] }, true);
    setSelectedObjectId(duplicated.id);
  };

  const handleDeleteObject = (id: string) => {
    const newObjects = doc.objects.filter((o) => o.id !== id);
    updateDocumentWithHistory({ ...doc, objects: newObjects }, true);
    if (selectedObjectId === id) setSelectedObjectId(null);
  };

  // Quick Insert from Toolbar
  const handleQuickInsert = (type: LabelObjectType) => {
    const newId = `obj-${Date.now()}`;
    const baseProps = {
      id: newId,
      x: 10,
      y: 10,
      rotation: 0 as const,
      zIndex: doc.objects.length + 1,
      locked: false,
      hidden: false,
    };

    let newObj: LabelObject;

    if (type === 'text') {
      newObj = {
        ...baseProps,
        name: 'New Text',
        type: 'text',
        text: 'Text Label',
        fontSize: 10,
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'left',
        color: '#000000',
        width: 35,
        height: 6,
      };
    } else if (type === 'barcode') {
      newObj = {
        ...baseProps,
        name: 'New Barcode',
        type: 'barcode',
        symbologyId: 'code128',
        data: 'LF-2026-X',
        showHumanReadable: true,
        humanReadablePosition: 'bottom',
        humanReadableFontSize: 8,
        includeCheckDigit: true,
        quietZoneMm: 2,
        color: '#000000',
        backgroundColor: '#ffffff',
        width: 45,
        height: 18,
      };
    } else if (type === 'qrcode') {
      newObj = {
        ...baseProps,
        name: 'New QR Code',
        type: 'qrcode',
        data: 'https://labelforge.io/verify',
        errorCorrection: 'M',
        color: '#000000',
        backgroundColor: '#ffffff',
        width: 18,
        height: 18,
      };
    } else if (type === 'datamatrix') {
      newObj = {
        ...baseProps,
        name: 'New DataMatrix',
        type: 'datamatrix',
        data: 'DM-PART-9988',
        format: 'square',
        color: '#000000',
        backgroundColor: '#ffffff',
        width: 14,
        height: 14,
      };
    } else if (type === 'shape') {
      newObj = {
        ...baseProps,
        name: 'New Box',
        type: 'shape',
        shapeType: 'rounded',
        strokeColor: '#000000',
        strokeWidth: 0.5,
        fillColor: '#ffffff',
        cornerRadius: 1,
        width: 40,
        height: 20,
      };
    } else if (type === 'counter') {
      newObj = {
        ...baseProps,
        name: 'New Serial',
        type: 'counter',
        prefix: 'SN-',
        suffix: '',
        currentValue: 1,
        startValue: 1,
        step: 1,
        padding: 5,
        fontSize: 9,
        fontFamily: 'JetBrains Mono',
        fontWeight: 'bold',
        color: '#000000',
        width: 30,
        height: 5,
      };
    } else {
      newObj = {
        ...baseProps,
        name: 'New DateTime',
        type: 'datetime',
        format: 'YYYY-MM-DD',
        offsetDays: 0,
        prefix: 'DATE: ',
        suffix: '',
        fontSize: 8,
        fontFamily: 'JetBrains Mono',
        fontWeight: 'normal',
        color: '#000000',
        width: 35,
        height: 5,
      };
    }

    updateDocumentWithHistory({ ...doc, objects: [...doc.objects, newObj] }, true);
    setSelectedObjectId(newId);
  };

  // Insert from Barcode Wizard
  const handleInsertSymbology = (sym: BarcodeSymbologyDefinition) => {
    const is2D = sym.dimension === '2D';
    const newObj: LabelObject = {
      id: `obj-${Date.now()}`,
      name: `${sym.name}`,
      type: is2D ? (sym.id.includes('qr') ? 'qrcode' : 'datamatrix') : 'barcode',
      symbologyId: sym.id,
      data: sym.defaultData,
      showHumanReadable: sym.supportsHumanReadableText,
      humanReadablePosition: 'bottom',
      humanReadableFontSize: 8,
      includeCheckDigit: true,
      quietZoneMm: 2,
      color: '#000000',
      backgroundColor: '#ffffff',
      errorCorrection: 'M',
      format: 'square',
      x: 10,
      y: 10,
      width: is2D ? 20 : 50,
      height: is2D ? 20 : 18,
      rotation: 0,
      zIndex: doc.objects.length + 1,
      locked: false,
      hidden: false,
    } as any;

    updateDocumentWithHistory({ ...doc, objects: [...doc.objects, newObj] }, true);
    setSelectedObjectId(newObj.id);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPrintDialogOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const cur = doc.objects.find((o) => o.id === selectedObjectId);
        if (cur) handleDuplicateObject(cur);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectId) {
          e.preventDefault();
          handleDeleteObject(selectedObjectId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, doc.objects, handleUndo, handleRedo]);

  const handlePrintCompleted = (
    copies: number,
    printerName: string,
    strategy: 'ZPL' | 'TSPL' | 'BROWSER_RASTER'
  ) => {
    const newJob: PrintJobRecord = {
      id: `job-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      templateName: doc.name,
      printerName,
      copies,
      batchCount: copies,
      status: 'COMPLETED',
      strategy,
    };
    setPrintHistory((prev) => [newJob, ...prev]);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#121214] text-zinc-100 overflow-hidden font-sans select-none">
      {/* 1. Header Toolbar */}
      <HeaderToolbar
        activeView={activeView}
        setActiveView={setActiveView}
        document={doc}
        onUpdateDocument={(d) => updateDocumentWithHistory(d, true)}
        selectedObjectId={selectedObjectId}
        onSelectObject={setSelectedObjectId}
        onUpdateObject={handleUpdateObject}
        onDeleteObject={handleDeleteObject}
        onDuplicateObject={handleDuplicateObject}
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        onQuickInsert={handleQuickInsert}
        zoom={zoom}
        setZoom={setZoom}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        snapGridEnabled={snapGridEnabled}
        setSnapGridEnabled={setSnapGridEnabled}
        liveDataPreview={liveDataPreview}
        setLiveDataPreview={setLiveDataPreview}
        onOpenBarcodeWizard={() => setIsBarcodeWizardOpen(true)}
        onOpenPrintDialog={() => setIsPrintDialogOpen(true)}
        onOpenPrinterManager={() => setIsPrinterManagerOpen(true)}
        onOpenPreflight={() => setIsPreflightOpen(true)}
        preflightResult={preflightResult}
      />

      {/* 2. Main Work Area: Designer Studio vs Tablet Operator Station */}
      {activeView === 'designer' ? (
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Toolbox */}
          <Toolbox
            selectedTool={selectedTool}
            setSelectedTool={setSelectedTool}
            onQuickInsert={handleQuickInsert}
            onOpenBarcodeWizard={() => setIsBarcodeWizardOpen(true)}
          />

          {/* Central Interactive WYSIWYG Canvas */}
          <Canvas
            document={doc}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            onUpdateObject={handleUpdateObject}
            zoom={zoom}
            showGrid={showGrid}
            snapGridEnabled={snapGridEnabled}
            gridStepMm={gridStepMm}
            liveDataPreview={liveDataPreview}
          />

          {/* Right Properties & Layers Inspector */}
          <PropertiesPanel
            document={doc}
            onUpdateDocument={(d) => updateDocumentWithHistory(d, true)}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            onUpdateObject={handleUpdateObject}
            onDuplicateObject={handleDuplicateObject}
            onDeleteObject={handleDeleteObject}
          />
        </div>
      ) : (
        /* Tablet Operator Print Station */
        <PrintStationView
          document={doc}
          onSelectDocument={(d) => updateDocumentWithHistory(d, true)}
          printers={printers}
          selectedPrinterId={selectedPrinterId}
          onSelectPrinter={setSelectedPrinterId}
          printHistory={printHistory}
          onExecutePrint={(copies) => {
            const p = printers.find((x) => x.id === selectedPrinterId) || printers[0];
            handlePrintCompleted(copies, p.name, p.language as any);
            window.print();
          }}
        />
      )}

      {/* 3. Global Status Bar */}
      <footer className="h-7 bg-[#18181b] border-t border-[#27272a] px-3 flex items-center justify-between text-[11px] font-mono text-zinc-400 select-none z-30 shrink-0">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-zinc-300">
              {printers.find((p) => p.id === selectedPrinterId)?.name}
            </span>
          </span>
          <span className="text-zinc-600">|</span>
          <span>{doc.objects.length} Elements</span>
          <span className="text-zinc-600">|</span>
          <span>Unit: {doc.unit}</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setLiveDataPreview(!liveDataPreview)}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              liveDataPreview
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Live Variable Preview on Canvas"
          >
            Data Preview: {liveDataPreview ? 'ON' : 'OFF'}
          </button>
          <span className="text-zinc-600">|</span>
          <button
            onClick={() => setSnapGridEnabled(!snapGridEnabled)}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              snapGridEnabled ? 'text-zinc-300' : 'text-zinc-600'
            }`}
          >
            Snap: {snapGridEnabled ? `${gridStepMm}mm` : 'OFF'}
          </button>
          <span className="text-zinc-600">|</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </footer>

      {/* MODALS */}
      <BarcodeWizardModal
        isOpen={isBarcodeWizardOpen}
        onClose={() => setIsBarcodeWizardOpen(false)}
        onInsertSymbology={handleInsertSymbology}
      />

      <PrintDialogModal
        isOpen={isPrintDialogOpen}
        onClose={() => setIsPrintDialogOpen(false)}
        document={doc}
        printers={printers}
        selectedPrinterId={selectedPrinterId}
        onSelectPrinter={setSelectedPrinterId}
        preflightResult={preflightResult}
        onPrintCompleted={handlePrintCompleted}
      />

      <PrinterManagerModal
        isOpen={isPrinterManagerOpen}
        onClose={() => setIsPrinterManagerOpen(false)}
        printers={printers}
        onUpdatePrinters={setPrinters}
        selectedPrinterId={selectedPrinterId}
        onSelectPrinter={setSelectedPrinterId}
      />

      <PreflightModal
        isOpen={isPreflightOpen}
        onClose={() => setIsPreflightOpen(false)}
        result={preflightResult}
        onSelectObject={(id) => {
          setSelectedObjectId(id);
          setActiveView('designer');
        }}
      />
    </div>
  );
}
