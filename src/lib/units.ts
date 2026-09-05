/**
 * Canonical Geometry & Physical Unit Conversions
 * Authoritative conversions for screen display and printer output.
 */

import { PhysicalUnit } from '../types';

export const MM_PER_INCH = 25.4;
export const POINTS_PER_INCH = 72.0;

/** Convert any physical unit to canonical millimeters */
export function toMm(value: number, unit: PhysicalUnit): number {
  switch (unit) {
    case 'mm':
      return value;
    case 'cm':
      return value * 10;
    case 'in':
      return value * MM_PER_INCH;
    case 'pt':
      return (value / POINTS_PER_INCH) * MM_PER_INCH;
    case 'dot':
      return (value / 203) * MM_PER_INCH; // baseline 203 dpi
    default:
      return value;
  }
}

/** Convert canonical millimeters to target unit */
export function fromMm(mm: number, unit: PhysicalUnit): number {
  switch (unit) {
    case 'mm':
      return mm;
    case 'cm':
      return mm / 10;
    case 'in':
      return mm / MM_PER_INCH;
    case 'pt':
      return (mm / MM_PER_INCH) * POINTS_PER_INCH;
    case 'dot':
      return (mm / MM_PER_INCH) * 203;
    default:
      return mm;
  }
}

/**
 * Screen pixels per millimeter at 100% zoom.
 * Using standard 96 DPI CSS baseline = 96 / 25.4 ≈ 3.7795 px/mm.
 */
export const SCREEN_PX_PER_MM = 96 / MM_PER_INCH;

export function mmToScreenPixels(mm: number, zoom = 1.0): number {
  return mm * SCREEN_PX_PER_MM * zoom;
}

export function screenPixelsToMm(px: number, zoom = 1.0): number {
  return px / (SCREEN_PX_PER_MM * zoom);
}

/** Convert physical mm to thermal printer dots */
export function mmToPrinterDots(mm: number, dpi: 203 | 300 | 600): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

/** Snap coordinate to nearest grid increment in mm */
export function snapToGrid(valueMm: number, stepMm = 1.0, enabled = true): number {
  if (!enabled || stepMm <= 0) return valueMm;
  return Math.round(valueMm / stepMm) * stepMm;
}

/** Format a number cleanly with units */
export function formatMeasurement(value: number, unit: PhysicalUnit, precision = 2): string {
  const rounded = Number(value.toFixed(precision));
  return `${rounded} ${unit}`;
}
