'use client';

import { useEffect, useMemo, useState } from 'react';
import { useConfigWithIds, useUserOptions } from '@/lib/useUserOptions';

interface CompanyOption {
  id: number;
  name: string;
}

interface InternalRelationship {
  id: number;
  company_id: number;
  rep_ids: string | null;
  contact_ids: string | null;
  relationship_status: string;
  description: string;
  created_at: string;
}

interface RepMapNode {
  repName: string;
  initials: string;
  statuses: string[];
  relationshipCount: number;
}

function parseIds(csv: string | null | undefined): number[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map(v => Number(v.trim()))
    .filter(v => !Number.isNaN(v) && v > 0);
}

function repInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function RelationshipsPage() {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [relationships, setRelationships] = useState<InternalRelationship[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingRelationships, setLoadingRelationships] = useState(false);

  const userOptions = useUserOptions();
  const relTypeOptions = useConfigWithIds('rep_relationship_type');

  useEffect(() => {
    let mounted = true;
    fetch('/api/companies?minimal=1')
      .then(r => (r.ok ? r.json() : []))
      .then((rows: { id: number; name: string }[]) => {
        if (!mounted) return;
        const normalized = rows.map(r => ({ id: Number(r.id), name: String(r.name) }));
        setCompanies(normalized);
        if (normalized.length > 0) setSelectedCompanyId(normalized[0].id);
      })
      .catch(() => {
        if (!mounted) return;
        setCompanies([]);
      })
      .finally(() => {
        if (mounted) setLoadingCompanies(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) {
      setRelationships([]);
      return;
    }
    let mounted = true;
    setLoadingRelationships(true);
    fetch(`/api/internal-relationships?company_id=${selectedCompanyId}`)
      .then(r => (r.ok ? r.json() : []))
      .then((rows: InternalRelationship[]) => {
        if (!mounted) return;
        setRelationships(rows);
      })
      .catch(() => {
        if (!mounted) return;
        setRelationships([]);
      })
      .finally(() => {
        if (mounted) setLoadingRelationships(false);
      });
    return () => { mounted = false; };
  }, [selectedCompanyId]);

  const selectedCompanyName = useMemo(
    () => companies.find(c => c.id === selectedCompanyId)?.name ?? 'Company',
    [companies, selectedCompanyId]
  );

  const mapNodes = useMemo<RepMapNode[]>(() => {
    const byRep = new Map<string, { statuses: Set<string>; relationshipCount: number }>();

    for (const rel of relationships) {
      const repIds = parseIds(rel.rep_ids);
      const statusIds = parseIds(rel.relationship_status);

      const statusLabels = statusIds
        .map(id => relTypeOptions.find(opt => opt.id === id)?.value)
        .filter(Boolean) as string[];

      const repNames = repIds.length > 0
        ? repIds.map(id => userOptions.find(u => u.id === id)?.value).filter(Boolean) as string[]
        : [];

      for (const name of repNames) {
        const existing = byRep.get(name) ?? { statuses: new Set<string>(), relationshipCount: 0 };
        statusLabels.forEach(status => existing.statuses.add(status));
        existing.relationshipCount += 1;
        byRep.set(name, existing);
      }
    }

    return Array.from(byRep.entries())
      .map(([repName, data]) => ({
        repName,
        initials: repInitials(repName),
        statuses: Array.from(data.statuses),
        relationshipCount: data.relationshipCount,
      }))
      .sort((a, b) => a.repName.localeCompare(b.repName));
  }, [relationships, relTypeOptions, userOptions]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
        <div className="max-w-md w-full">
          <label className="label">Company</label>
          <select
            value={selectedCompanyId ?? ''}
            onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : null)}
            className="input-field w-full"
            disabled={loadingCompanies || companies.length === 0}
          >
            {companies.length === 0 ? (
              <option value="">No companies available</option>
            ) : (
              companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="text-sm text-gray-500">
          {loadingRelationships ? 'Loading relationship map…' : `${mapNodes.length} rep connection(s)`}
        </div>
      </div>

      <div className="card overflow-hidden">
        {loadingRelationships ? (
          <div className="h-[520px] flex items-center justify-center text-gray-400 text-sm">Loading…</div>
        ) : mapNodes.length === 0 ? (
          <div className="h-[420px] flex items-center justify-center text-gray-400 text-sm">
            No rep relationships found for this company.
          </div>
        ) : (
          <div className="relative p-6 min-h-[520px] bg-gradient-to-b from-white to-gray-50/60">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
              {mapNodes.map((node, idx) => {
                const y = 90 + idx * 95;
                return (
                  <line
                    key={node.repName}
                    x1="220"
                    y1="260"
                    x2="520"
                    y2={y}
                    stroke="#4B5563"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#4B5563" />
                </marker>
              </defs>
            </svg>

            <div className="relative flex min-h-[520px]">
              <div className="w-[220px] flex items-center justify-center">
                <div className="w-[190px] rounded-xl border-2 border-gray-300 bg-white shadow-sm px-4 py-6 text-center">
                  <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Company</p>
                  <p className="mt-2 text-base font-semibold text-procare-dark-blue break-words">{selectedCompanyName}</p>
                </div>
              </div>

              <div className="flex-1 ml-[180px] space-y-6 py-4">
                {mapNodes.map((node) => (
                  <div key={node.repName} className="w-[250px] rounded-xl border-2 border-gray-300 bg-white shadow-sm p-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                        {node.initials}
                      </span>
                      <p className="text-sm font-semibold text-gray-800">{node.repName}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {node.relationshipCount} relationship{node.relationshipCount === 1 ? '' : 's'}
                    </p>
                    {node.statuses.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {node.statuses.map(status => (
                          <span
                            key={status}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-procare-bright-blue border border-blue-200"
                          >
                            {status}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
