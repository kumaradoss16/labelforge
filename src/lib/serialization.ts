/**
 * Transactional Serialization & Dynamic Data Binding Engine
 * Resolves mustache-style variable placeholders {{variable}}
 * and handles sequential numbering with padding and prefixes.
 */

import { CounterLabelObject, LabelDocument, LabelObject } from '../types';

/** Safe variable interpolation */
export function interpolateVariables(
  template: string,
  variables: Record<string, string | number> = {}
): string {
  if (!template) return '';
  return template.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (match, key) => {
    if (key in variables) {
      return String(variables[key]);
    }
    return match; // keep placeholder if missing
  });
}

/** Resolves an object's display values given current variables and sequential counter */
export function resolveObjectWithData(
  obj: LabelObject,
  variables: Record<string, string | number> = {},
  batchIndex = 0
): LabelObject {
  if (obj.type === 'text') {
    return {
      ...obj,
      text: interpolateVariables(obj.text, variables),
    };
  }

  if (obj.type === 'barcode') {
    return {
      ...obj,
      data: interpolateVariables(obj.data, variables),
    };
  }

  if (obj.type === 'qrcode' || obj.type === 'datamatrix') {
    return {
      ...obj,
      data: interpolateVariables(obj.data, variables),
    };
  }

  if (obj.type === 'counter') {
    const calculatedValue = obj.startValue + batchIndex * obj.step;
    return {
      ...obj,
      currentValue: calculatedValue,
    };
  }

  return obj;
}

/** Formats a counter object into its display string e.g. "SN-00042-B" */
export function formatCounterString(counter: CounterLabelObject, batchOffset = 0): string {
  const val = counter.startValue + batchOffset * counter.step;
  const padded = String(val).padStart(counter.padding, '0');
  return `${counter.prefix}${padded}${counter.suffix}`;
}
