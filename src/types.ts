/**
 * LabelForge Platform - Master Types Definition
 * Independent BarTender-class enterprise label design & printing engine
 */

export type PhysicalUnit = 'mm' | 'in' | 'cm' | 'pt' | 'dot';

export type LabelOrientation = 'portrait' | 'landscape';

export type LabelShapeType = 'rectangle' | 'rounded' | 'circle' | 'line';

export type BarcodeDimension = '1D' | '2D' | 'Composite' | 'Postal';

export type SymbologyCategory =
  | 'Linear 1D'
  | '2D Matrix'
  | 'GS1'
  | 'Postal'
  | 'Retail & ISBN'
  | 'Specialized';

export type CapabilityStatus =
  | 'SUPPORTED'
  | 'PARTIAL'
  | 'RENDER_ONLY'
  | 'PRINTER_CODE_ONLY'
  | 'PLUGIN_REQUIRED'
  | 'NOT_AVAILABLE';

export interface BarcodeSymbologyDefinition {
  id: string;
  name: string;
  aliases: string[];
  category: SymbologyCategory;
  dimension: BarcodeDimension;
  defaultData: string;
  supportsVariableData: boolean;
  supportsHumanReadableText: boolean;
  supportsChecksum: boolean;
  supportsGS1: boolean;
  supportsErrorCorrection: boolean;
  capability: CapabilityStatus;
  printerLanguages: ('ZPL' | 'TSPL' | 'EPL' | 'CPCL')[];
  description: string;
  characterSetHint?: string;
}

export type LabelObjectType =
  | 'text'
  | 'barcode'
  | 'qrcode'
  | 'datamatrix'
  | 'shape'
  | 'counter'
  | 'datetime'
  | 'image';

export interface BaseLabelObject {
  id: string;
  name: string;
  type: LabelObjectType;
  x: number; // in mm
  y: number; // in mm
  width: number; // in mm
  height: number; // in mm
  rotation: 0 | 90 | 180 | 270;
  zIndex: number;
  locked: boolean;
  hidden: boolean;
}

export interface TextLabelObject extends BaseLabelObject {
  type: 'text';
  text: string;
  fontSize: number; // in pt
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '500' | '600' | '700';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  variableBinding?: string;
  multiline?: boolean;
}

export interface BarcodeLabelObject extends BaseLabelObject {
  type: 'barcode';
  symbologyId: string;
  data: string;
  variableBinding?: string;
  showHumanReadable: boolean;
  humanReadablePosition: 'bottom' | 'top' | 'none';
  humanReadableFontSize: number;
  barWidthRatio?: number; // ratio of wide to narrow bars (e.g. 2.0 to 3.0)
  includeCheckDigit: boolean;
  quietZoneMm: number;
  color: string;
  backgroundColor: string;
}

export interface QrCodeLabelObject extends BaseLabelObject {
  type: 'qrcode';
  data: string;
  variableBinding?: string;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  color: string;
  backgroundColor: string;
}

export interface DataMatrixLabelObject extends BaseLabelObject {
  type: 'datamatrix';
  data: string;
  variableBinding?: string;
  format: 'square' | 'rectangular';
  color: string;
  backgroundColor: string;
}

export interface ShapeLabelObject extends BaseLabelObject {
  type: 'shape';
  shapeType: LabelShapeType;
  strokeColor: string;
  strokeWidth: number; // in mm
  fillColor: string;
  cornerRadius: number; // for rounded rectangles in mm
}

export interface CounterLabelObject extends BaseLabelObject {
  type: 'counter';
  prefix: string;
  suffix: string;
  currentValue: number;
  startValue: number;
  step: number;
  padding: number; // e.g. 5 => 00042
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '600';
  color: string;
}

export interface DateTimeLabelObject extends BaseLabelObject {
  type: 'datetime';
  format: string; // e.g. 'YYYY-MM-DD', 'DD/MM/YYYY HH:mm', 'YYYY.MM'
  offsetDays: number; // for expiry date calculations, e.g. +365 days
  prefix: string;
  suffix: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '600';
  color: string;
}

export interface ImageLabelObject extends BaseLabelObject {
  type: 'image';
  src: string;
  preserveAspectRatio: boolean;
  ditherForThermal: boolean;
}

export type LabelObject =
  | TextLabelObject
  | BarcodeLabelObject
  | QrCodeLabelObject
  | DataMatrixLabelObject
  | ShapeLabelObject
  | CounterLabelObject
  | DateTimeLabelObject
  | ImageLabelObject;

export interface LabelMargins {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface LabelDocument {
  id: string;
  name: string;
  description?: string;
  version: string;
  width: number; // in mm
  height: number; // in mm
  unit: PhysicalUnit;
  dpi: 203 | 300 | 600;
  orientation: LabelOrientation;
  cornerRadius: number; // in mm, for die-cut labels
  margins: LabelMargins;
  backgroundColor: string;
  objects: LabelObject[];
  variables: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface PrinterProfile {
  id: string;
  name: string;
  manufacturer: 'Zebra' | 'TSC' | 'Brother' | 'Citizen' | 'Datamax' | 'Generic';
  model: string;
  dpi: 203 | 300 | 600;
  language: 'ZPL' | 'TSPL' | 'EPL' | 'CPCL' | 'RASTER';
  connection: 'TCP/IP' | 'USB' | 'Bluetooth' | 'Windows Spooler';
  address: string;
  status: 'online' | 'offline' | 'busy';
  isDefault: boolean;
  maxPrintWidthMm: number;
}

export interface PreflightIssue {
  type: 'error' | 'warning' | 'info';
  objectId?: string;
  objectName?: string;
  message: string;
  suggestion?: string;
}

export interface PreflightResult {
  valid: boolean;
  errors: PreflightIssue[];
  warnings: PreflightIssue[];
  info: PreflightIssue[];
}

export interface PrintJobRecord {
  id: string;
  timestamp: string;
  templateName: string;
  printerName: string;
  copies: number;
  batchCount: number;
  status: 'COMPLETED' | 'PRINTING' | 'FAILED' | 'QUEUED';
  strategy: 'ZPL' | 'TSPL' | 'PDF' | 'BROWSER_RASTER';
}
