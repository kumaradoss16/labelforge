/**
 * Preflight Quality Assurance Inspection Modal
 * Detailed breakdown of blockers, warnings, and barcode compliance.
 */

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X, ShieldAlert } from 'lucide-react';
import { PreflightResult } from '../types';

interface PreflightModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PreflightResult;
  onSelectObject: (id: string) => void;
}

export const PreflightModal: React.FC<PreflightModalProps> = ({
  isOpen,
  onClose,
  result,
  onSelectObject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-zinc-800 text-amber-400 border border-zinc-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Preflight QA Audit Report</h2>
              <p className="text-xs text-zinc-400">
                Automated thermal media tolerances, quiet zones, and barcode compliance checks.
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

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
          {/* Errors / Blockers */}
          {result.errors.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">
                Blockers ({result.errors.length}) — Must resolve before printing
              </span>
              <div className="space-y-1.5">
                {result.errors.map((err, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (err.objectId) {
                        onSelectObject(err.objectId);
                        onClose();
                      }
                    }}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 flex items-start space-x-2.5 cursor-pointer hover:bg-red-500/15 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">{err.message}</div>
                      {err.suggestion && (
                        <div className="text-[11px] opacity-80 mt-0.5">Suggestion: {err.suggestion}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                Warnings ({result.warnings.length}) — Recommended improvements
              </span>
              <div className="space-y-1.5">
                {result.warnings.map((warn, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (warn.objectId) {
                        onSelectObject(warn.objectId);
                        onClose();
                      }
                    }}
                    className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 flex items-start space-x-2.5 cursor-pointer hover:bg-amber-500/15 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">{warn.message}</div>
                      {warn.suggestion && (
                        <div className="text-[11px] opacity-80 mt-0.5">Suggestion: {warn.suggestion}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info / Passing */}
          {result.errors.length === 0 && result.warnings.length === 0 && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-sm">Perfect Compliance</div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  All barcode checksums, quiet zones, and geometry boundaries strictly pass industrial tolerances.
                </div>
              </div>
            </div>
          )}
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
