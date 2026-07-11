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
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 space-y-2.5 relative overflow-hidden shadow-lg">
      {/* Unique Dark Art Header Background Texture */}
      <div className="absolute inset-0 bg-[url('/images/bg-dark-art.jpg')] bg-cover bg-top opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] pointer-events-none" />
      
      <div className="max-w-md mx-auto flex items-center justify-between gap-3 relative z-10">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-idbi-blue to-idbi-cyan flex items-center justify-center shadow-md shadow-idbi-cyan/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-white">IDBI Health</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-idbi-blue/30 text-idbi-cyan border border-idbi-cyan/30">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">MSME Alternate Data App</p>
          </div>
        </div>

        {/* Profile Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
          <UserCheck className="w-3.5 h-3.5 text-idbi-cyan shrink-0" />
          <select
            value={currentMsme.msmeId}
            onChange={(e) => onSwitchMsme(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer max-w-[100px] truncate"
            title="Switch demo profile"
          >
            {allMsmes.map((m) => (
              <option key={m.msmeId} value={m.msmeId} className="bg-slate-950 text-slate-200">
                {m.businessName.substring(0, 14)} ({m.healthScore})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live API and Judge Demo Controls Bar */}
      <div className="max-w-md mx-auto flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[10px] relative z-10">
        <button
          onClick={() => setIsLiveApi(!isLiveApi)}
          className={`px-2 py-1 rounded-lg font-bold border flex items-center gap-1.5 transition-all ${
            isLiveApi
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm'
              : 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm'
          }`}
          title="Toggle connection to live scoring backend"
        >
          <Database className="w-3 h-3 animate-pulse shrink-0" />
          <span>{isLiveApi ? `Live API (${dataSource || 'Active'})` : 'Local Audit Mode'}</span>
        </button>

        <button
          onClick={() => setIsJudgeDemo(!isJudgeDemo)}
          className={`px-2 py-1 rounded-lg font-bold border flex items-center gap-1 transition-all ${
            isJudgeDemo
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
          title="Enable automatic live fallback for 100% stage reliability during judge evaluation"
        >
          <Award className="w-3 h-3 shrink-0 text-purple-400" />
          <span>Judge Demo Mode: {isJudgeDemo ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </header>
  );
};
