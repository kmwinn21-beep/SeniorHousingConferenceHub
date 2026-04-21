'use client';

import { useState } from 'react';
import type { UserResolutionEntry } from '@/app/api/upload-preview/unique-values/route';

interface UserOption {
  id: number;
  value: string;
}

interface Props {
  fileName: string;
  totalRows: number;
  entries: UserResolutionEntry[];
  userOptions: UserOption[];
  onConfirm: (resolutions: Record<string, number | null>) => void;
  onBack: () => void;
  onCancel: () => void;
}

export function AssignedUserConfirmModal({
  fileName,
  totalRows,
  entries,
  userOptions,
  onConfirm,
  onBack,
  onCancel,
}: Props) {
  // resolutions[raw] = selected config_options.id, or null = unassigned
  const [resolutions, setResolutions] = useState<Record<string, number | null>>(() => {
    const init: Record<string, number | null> = {};
    for (const e of entries) {
      init[e.raw] = e.resolved_id;
    }
    return init;
  });

  const matchedCount = Object.values(resolutions).filter(v => v !== null).length;
  const unmatchedCount = entries.length - matchedCount;

  const handleChange = (raw: string, value: string) => {
    setResolutions(prev => ({ ...prev, [raw]: value ? Number(value) : null }));
  };

  const handleConfirm = () => {
    onConfirm(resolutions);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-brand-highlight w-full max-w-xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-brand-primary font-serif">Confirm Assigned Users</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{fileName} &middot; {totalRows.toLocaleString()} rows</p>
          </div>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 ml-4 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <p className="text-sm text-gray-500 mb-4">
            These unique values were detected in the <strong>Assigned User</strong> column.
            Confirm or correct each match before uploading.
            <span className="ml-1 font-medium text-green-600">{matchedCount} matched</span>
            {unmatchedCount > 0 && (
              <span className="ml-1 font-medium text-red-500">&middot; {unmatchedCount} unmatched</span>
            )}
          </p>

          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No Assigned User values found in file.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4">CSV Value</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Matched User</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const selected = resolutions[entry.raw];
                  const isMatched = selected !== null && selected !== undefined;
                  return (
                    <tr key={entry.raw} className={i % 2 === 0 ? 'bg-gray-50/60' : ''}>
                      <td className="py-2 pr-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0 ${
                              isMatched ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                            }`}
                          >
                            {isMatched ? (
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </span>
                          <span className="font-mono text-xs text-gray-700 truncate max-w-[160px]" title={entry.raw}>
                            {entry.raw}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 align-middle">
                        <select
                          value={selected ?? ''}
                          onChange={e => handleChange(entry.raw, e.target.value)}
                          className={`w-full text-sm border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 bg-white transition-colors ${
                            isMatched
                              ? 'border-green-300 focus:ring-green-200'
                              : 'border-red-300 focus:ring-red-200'
                          }`}
                        >
                          <option value="">— Not Assigned —</option>
                          {userOptions.map(u => (
                            <option key={u.id} value={String(u.id)}>{u.value}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          {unmatchedCount > 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              <strong>{unmatchedCount}</strong> value{unmatchedCount !== 1 ? 's' : ''} will be uploaded without an assigned user.
              Correct them above or continue anyway.
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onBack} className="btn-secondary text-sm">
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onCancel} className="btn-secondary text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="btn-primary text-sm"
              >
                Confirm &amp; Upload
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
