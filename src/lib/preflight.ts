/**
 * Label Preflight & Barcode Quality Assurance Engine
 * Inspects geometry boundaries, barcode symbology rules, and variable bindings.
 */

import { LabelDocument, PreflightIssue, PreflightResult } from '../types';
import { getSymbologyById } from './barcodeCatalog';

export function runPreflight(doc: LabelDocument): PreflightResult {
  const errors: PreflightIssue[] = [];
  const warnings: PreflightIssue[] = [];
  const info: PreflightIssue[] = [];

  // Check overall document dimensions
  if (doc.width <= 10 || doc.height <= 10) {
    errors.push({
      type: 'error',
      message: `Label dimensions (${doc.width}x${doc.height} mm) are unusually small for thermal print media.`,
      suggestion: 'Verify media width and height in document settings.',
    });
  }

  // Check objects within printable boundary
  for (const obj of doc.objects) {
    if (obj.hidden) continue;

    // Boundary check
    if (obj.x < 0 || obj.y < 0) {
      warnings.push({
        type: 'warning',
        objectId: obj.id,
        objectName: obj.name,
        message: `Object "${obj.name}" has negative coordinates (${obj.x.toFixed(1)}, ${obj.y.toFixed(1)} mm).`,
        suggestion: 'Move object onto printable canvas surface.',
      });
    }

    if (obj.x + obj.width > doc.width + 0.5 || obj.y + obj.height > doc.height + 0.5) {
      errors.push({
        type: 'error',
        objectId: obj.id,
        objectName: obj.name,
        message: `Object "${obj.name}" extends beyond the label edge (${(obj.x + obj.width).toFixed(1)} > ${doc.width} mm). Content will be clipped.`,
        suggestion: 'Resize or reposition the object inside the label margins.',
      });
    }

    // Barcode-specific validation
    if (obj.type === 'barcode') {
      const sym = getSymbologyById(obj.symbologyId);
      const data = obj.data.trim();

      if (!data) {
        errors.push({
          type: 'error',
          objectId: obj.id,
          objectName: obj.name,
          message: `Barcode "${obj.name}" has empty data.`,
          suggestion: 'Provide literal data or link a variable field.',
        });
        continue;
      }

      // EAN-13 / UPC-A digits rule
      if (sym.id === 'ean13') {
        const digits = data.replace(/\D/g, '');
        if (digits.length < 12 || digits.length > 13) {
          errors.push({
            type: 'error',
            objectId: obj.id,
            objectName: obj.name,
            message: `EAN-13 requires exactly 12 or 13 numeric digits. Found ${data.length}.`,
            suggestion: 'Enter 12 digits (check digit will auto-calculate) or 13 digits.',
          });
        }
      } else if (sym.id === 'upca') {
        const digits = data.replace(/\D/g, '');
        if (digits.length < 11 || digits.length > 12) {
          errors.push({
            type: 'error',
            objectId: obj.id,
            objectName: obj.name,
            message: `UPC-A requires 11 or 12 numeric digits. Found ${data.length}.`,
            suggestion: 'Enter 11 digits (check digit will auto-calculate) or 12 digits.',
          });
        }
      } else if (sym.id === 'interleaved2of5' || sym.id === 'itf14') {
        if (!/^\d+$/.test(data)) {
          errors.push({
            type: 'error',
            objectId: obj.id,
            objectName: obj.name,
            message: `ITF / Interleaved 2 of 5 only accepts numeric digits (0-9).`,
            suggestion: 'Remove non-numeric characters.',
          });
        }
      }

      // Minimum height check for linear barcode scanning
      if (obj.height < 6) {
        warnings.push({
          type: 'warning',
          objectId: obj.id,
          objectName: obj.name,
          message: `Barcode height (${obj.height} mm) is under recommended 6 mm for handheld laser/imager scanning.`,
          suggestion: 'Increase barcode height to improve first-pass scan rate.',
        });
      }
    }

    // 2D QR / DataMatrix minimum size check
    if (obj.type === 'qrcode' || obj.type === 'datamatrix') {
      if (obj.width < 8 || obj.height < 8) {
        warnings.push({
          type: 'warning',
          objectId: obj.id,
          objectName: obj.name,
          message: `2D symbol "${obj.name}" (${obj.width}x${obj.height} mm) may be difficult to scan on lower resolution (203 DPI) thermal printheads.`,
          suggestion: 'Recommended minimum size for 2D symbols is 10x10 mm on 203 DPI.',
        });
      }
    }

    // Text truncation or empty check
    if (obj.type === 'text' && !obj.text.trim()) {
      warnings.push({
        type: 'warning',
        objectId: obj.id,
        objectName: obj.name,
        message: `Text element "${obj.name}" is empty.`,
        suggestion: 'Provide label text or remove unused element.',
      });
    }
  }

  if (errors.length === 0 && warnings.length === 0) {
    info.push({
      type: 'info',
      message: 'All elements conform to thermal print layout standards and boundary tolerances.',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
  };
}
