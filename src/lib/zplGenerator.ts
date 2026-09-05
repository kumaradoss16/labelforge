/**
 * Industrial Thermal Printer Code Generators
 * Generates valid Zebra ZPL II and TSC TSPL for direct thermal/thermal transfer printing.
 */

import { LabelDocument } from '../types';
import { mmToPrinterDots as convertMmToDots } from './units';

export function generateZpl(doc: LabelDocument, dpi: 203 | 300 | 600 = 203): string {
  const widthDots = convertMmToDots(doc.width, dpi);
  const heightDots = convertMmToDots(doc.height, dpi);

  const lines: string[] = [];
  lines.push('^XA'); // Start Format
  lines.push(`^PW${widthDots}`); // Print Width
  lines.push(`^LL${heightDots}`); // Label Length
  lines.push('^LH0,0'); // Label Home
  lines.push('^CI28'); // UTF-8 Encoding

  // Process objects sorted by zIndex
  const sortedObjects = [...doc.objects].sort((a, b) => a.zIndex - b.zIndex);

  for (const obj of sortedObjects) {
    if (obj.hidden) continue;

    const x = convertMmToDots(obj.x, dpi);
    const y = convertMmToDots(obj.y, dpi);
    const w = convertMmToDots(obj.width, dpi);
    const h = convertMmToDots(obj.height, dpi);

    if (obj.type === 'text') {
      const fontHeight = Math.round(obj.fontSize * (dpi / 72));
      const fontWidth = Math.round(fontHeight * 0.7);
      lines.push(`^FO${x},${y}^A0N,${fontHeight},${fontWidth}^FD${obj.text}^FS`);
    } else if (obj.type === 'barcode') {
      // Linear barcode: Code 128 / Code 39
      const barH = h > 10 ? h : 50;
      const showHr = obj.showHumanReadable ? 'Y' : 'N';
      if (obj.symbologyId.includes('39')) {
        lines.push(`^FO${x},${y}^B3N,N,${barH},${showHr},N^FD${obj.data}^FS`);
      } else if (obj.symbologyId.includes('ean') || obj.symbologyId.includes('upc')) {
        lines.push(`^FO${x},${y}^BEN,${barH},${showHr},N^FD${obj.data}^FS`);
      } else {
        // Default Code 128
        lines.push(`^FO${x},${y}^BCN,${barH},${showHr},N,N^FD${obj.data}^FS`);
      }
    } else if (obj.type === 'qrcode') {
      // QR Code
      const mag = Math.max(2, Math.min(10, Math.round(w / 30)));
      lines.push(`^FO${x},${y}^BQN,2,${mag}^FDQA,${obj.data}^FS`);
    } else if (obj.type === 'datamatrix') {
      // Data Matrix
      lines.push(`^FO${x},${y}^BXN,${Math.round(w / 10)},200^FD${obj.data}^FS`);
    } else if (obj.type === 'shape') {
      const strokeThickness = Math.max(1, convertMmToDots(obj.strokeWidth || 0.5, dpi));
      if (obj.shapeType === 'line') {
        lines.push(`^FO${x},${y}^GB${w},${strokeThickness},${strokeThickness}^FS`);
      } else if (obj.shapeType === 'circle') {
        const radius = Math.round(w / 2);
        lines.push(`^FO${x},${y}^GC${w},${strokeThickness},B^FS`);
      } else {
        const rounding = obj.shapeType === 'rounded' ? Math.round(obj.cornerRadius * (dpi / 25.4)) : 0;
        lines.push(`^FO${x},${y}^GB${w},${h},${strokeThickness},B,${Math.min(8, Math.round(rounding / 2))}^FS`);
      }
    } else if (obj.type === 'counter') {
      const fontHeight = Math.round(obj.fontSize * (dpi / 72));
      const valStr = String(obj.currentValue).padStart(obj.padding, '0');
      lines.push(`^FO${x},${y}^A0N,${fontHeight},${Math.round(fontHeight * 0.7)}^FD${obj.prefix}${valStr}${obj.suffix}^FS`);
    } else if (obj.type === 'datetime') {
      const fontHeight = Math.round(obj.fontSize * (dpi / 72));
      const now = new Date();
      if (obj.offsetDays) now.setDate(now.getDate() + obj.offsetDays);
      const dtStr = now.toISOString().split('T')[0];
      lines.push(`^FO${x},${y}^A0N,${fontHeight},${Math.round(fontHeight * 0.7)}^FD${obj.prefix}${dtStr}${obj.suffix}^FS`);
    }
  }

  lines.push('^XZ'); // End Format
  return lines.join('\n');
}

export function generateTspl(doc: LabelDocument): string {
  const lines: string[] = [];
  lines.push(`SIZE ${doc.width} mm, ${doc.height} mm`);
  lines.push('GAP 3 mm, 0 mm');
  lines.push('DIRECTION 1');
  lines.push('CLS');

  const sortedObjects = [...doc.objects].sort((a, b) => a.zIndex - b.zIndex);
  for (const obj of sortedObjects) {
    if (obj.hidden) continue;
    const xDots = Math.round(obj.x * 8); // 8 dots/mm at 203 dpi
    const yDots = Math.round(obj.y * 8);
    const wDots = Math.round(obj.width * 8);
    const hDots = Math.round(obj.height * 8);

    if (obj.type === 'text') {
      lines.push(`TEXT ${xDots},${yDots},"3",0,1,1,"${obj.text}"`);
    } else if (obj.type === 'barcode') {
      lines.push(`BARCODE ${xDots},${yDots},"128",${hDots},1,0,2,2,"${obj.data}"`);
    } else if (obj.type === 'qrcode') {
      lines.push(`QRCODE ${xDots},${yDots},L,4,A,0,"${obj.data}"`);
    } else if (obj.type === 'datamatrix') {
      lines.push(`DMATRIX ${xDots},${yDots},${wDots},${hDots},"${obj.data}"`);
    } else if (obj.type === 'shape') {
      lines.push(`BOX ${xDots},${yDots},${xDots + wDots},${yDots + hDots},2`);
    }
  }

  lines.push('PRINT 1,1');
  return lines.join('\n');
}
