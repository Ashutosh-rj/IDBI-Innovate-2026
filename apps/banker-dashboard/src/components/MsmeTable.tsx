import React, { useState } from 'react';
import type { MsmeProfile } from '../types';
import { Search, Filter, ArrowRight, ShieldCheck, AlertCircle, FileText } from 'lucide-react';

interface MsmeTableProps {
  cohort: MsmeProfile[];
  onSelectMsme: (msme: MsmeProfile) => void;
}

export const MsmeTable: React.FC<MsmeTableProps> = ({ cohort, onSelectMsme }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState('ALL');

  const sectors = Array.from(new Set(cohort.map(c => c.sector)));

  const filteredCohort = cohort.filter((msme) => {
    const matchesSearch =
      msme.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msme.udyamNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msme.msmeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = riskFilter === 'ALL' || msme.riskBand === riskFilter;
    const matchesSector = sectorFilter === 'ALL' || msme.sector === sectorFilter;

    return matchesSearch && matchesRisk && matchesSector;
  });

  return (
    <div className="glass-card p-6 space-y-6 animate-fadeIn">
      {/* Table Header & Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-idbi-cyan" />
            MSME Applicant Directory & Scorecards
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time alternate data health assessments with TreeSHAP explainability & OCEN 4.0 passports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search business, Udyam ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-idbi-cyan transition-all"
            />
          </div>

          {/* Risk Band Filter */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-idbi-cyan transition-all"
            >
              <option value="ALL">All Risk Bands</option>
              <option value="PRIME_RISK">Prime Risk (≥700)</option>
              <option value="MODERATE_RISK">Moderate Risk (600-699)</option>
              <option value="HIGH_RISK">High Risk (&lt;600)</option>
            </select>
          </div>

          {/* Sector Filter */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-idbi-cyan transition-all"
          >
            <option value="ALL">All Sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/50">
              <th className="py-3 px-4 rounded-l-xl">Applicant Profile</th>
              <th className="py-3 px-4">Sector & Vintage</th>
              <th className="py-3 px-4">Health Score</th>
              <th className="py-3 px-4">Risk Tier & PD</th>
              <th className="py-3 px-4">OCEN Passport</th>
              <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {filteredCohort.map((msme) => (
              <tr
                key={msme.msmeId}
                onClick={() => onSelectMsme(msme)}
                className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <td className="py-4 px-4 font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center font-bold text-idbi-cyan">
                      {msme.businessName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-idbi-cyan transition-colors">
                        {msme.businessName}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{msme.udyamNumber}</p>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-4">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold">
                    {msme.sector}
                  </span>
                  <p className="text-xs text-slate-400 mt-1.5">Reg: {msme.registrationDate}</p>
                </td>

                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-extrabold ${
                      msme.healthScore >= 700 ? 'text-emerald-400' : msme.healthScore >= 600 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {msme.healthScore}
                    </span>
                    <span className="text-xs text-slate-500">/ 900</span>
                  </div>
                </td>

                <td className="py-4 px-4">
                  <div className="flex flex-col gap-1.5 items-start">
                    <span className={
                      msme.riskBand === 'PRIME_RISK' ? 'badge-prime' : msme.riskBand === 'MODERATE_RISK' ? 'badge-moderate' : 'badge-high'
                    }>
                      {msme.riskBand.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      12m PD: <strong className="text-slate-200">{(msme.defaultProbability12m * 100).toFixed(1)}%</strong>
                    </span>
                    {msme.isNtcThinFile && (
                      <span className="badge-ntc">NTC Thin-File</span>
                    )}
                  </div>
                </td>

                <td className="py-4 px-4">
                  {msme.ocenLspPayload ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{msme.ocenLspPayload.creditPassportId}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <AlertCircle className="w-4 h-4" />
                      <span>Not Published</span>
                    </div>
                  )}
                </td>

                <td className="py-4 px-4 text-right">
                  <button className="px-3 py-1.5 bg-slate-800 group-hover:bg-idbi-blue/20 text-slate-300 group-hover:text-idbi-cyan rounded-xl text-xs font-semibold border border-slate-700 group-hover:border-idbi-cyan/40 transition-all flex items-center gap-1 ml-auto">
                    Analyze <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCohort.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 font-medium">No MSME applicants match the selected filters or search term.</p>
        </div>
      )}
    </div>
  );
};
