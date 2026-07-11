import React from 'react';
import type { MsmeProfile } from '../types';
import { ShieldCheck, UserCheck, Database, Award } from 'lucide-react';

interface HeaderProps {
  currentMsme: MsmeProfile;
  onSwitchMsme: (msmeId: string) => void;
  allMsmes: MsmeProfile[];
  isLiveApi: boolean;
  setIsLiveApi: (live: boolean) => void;
  isJudgeDemo: boolean;
  setIsJudgeDemo: (demo: boolean) => void;
  dataSource?: 'GATEWAY_8080' | 'DIRECT_8000' | 'JUDGE_FALLBACK' | 'STATIC';
}

export const Header: React.FC<HeaderProps> = ({
  currentMsme,
  onSwitchMsme,
  allMsmes,
  isLiveApi,
  setIsLiveApi,
  isJudgeDemo,
  setIsJudgeDemo,
  dataSource
}) => {
  return (
    <header className="sticky top-0 z-50 bg-idbi-navy border-b border-[#001f35] px-4 py-3 space-y-2.5 relative shadow-md text-white">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3 relative z-10">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#001f35] border border-idbi-blue/40 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5 text-idbi-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-extrabold tracking-tight text-white">IDBI Health</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#001f35] text-idbi-cyan border border-idbi-cyan/30">
                PWA
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                ★ Team v22
              </span>
            </div>
            <p className="text-[10px] text-slate-200 font-medium truncate">v22 • Every version is better than the last</p>
          </div>
        </div>

        {/* Profile Switcher */}
        <div className="flex items-center gap-1.5 bg-[#001f35] border border-idbi-blue/40 rounded-xl px-2.5 py-1">
          <UserCheck className="w-3.5 h-3.5 text-idbi-cyan shrink-0" />
          <select
            value={currentMsme.msmeId}
            onChange={(e) => onSwitchMsme(e.target.value)}
            className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer max-w-[100px] truncate"
            title="Switch demo profile"
          >
            {allMsmes.map((m) => (
              <option key={m.msmeId} value={m.msmeId} className="bg-idbi-navy text-white">
                {m.businessName.substring(0, 14)} ({m.healthScore})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live API and Judge Demo Controls Bar */}
      <div className="max-w-md mx-auto flex items-center justify-between gap-2 pt-1 border-t border-idbi-blue/30 text-[10px] relative z-10">
        <button
          onClick={() => setIsLiveApi(!isLiveApi)}
          className={`px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1.5 transition-all focus:outline-none focus:ring-1 focus:ring-white ${
            isLiveApi
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
              : 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm'
          }`}
          title="Toggle connection to live scoring backend"
        >
          <Database className="w-3 h-3 animate-pulse shrink-0" />
          <span>{isLiveApi ? `Live API (${dataSource || 'Active'})` : 'Local Audit Mode'}</span>
        </button>

        <button
          onClick={() => setIsJudgeDemo(!isJudgeDemo)}
          className={`px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1 transition-all focus:outline-none focus:ring-1 focus:ring-white ${
            isJudgeDemo
              ? 'bg-purple-50 text-purple-800 border-purple-300 shadow-sm'
              : 'bg-[#001f35] text-slate-200 border-idbi-blue/40'
          }`}
          title="Enable automatic live fallback for 100% stage reliability during judge evaluation"
        >
          <Award className="w-3 h-3 shrink-0 text-purple-300" />
          <span>Judge Demo Mode: {isJudgeDemo ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </header>
  );
};
