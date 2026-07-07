import React from 'react';
import type { MsmeProfile } from '../types';
import { ShieldCheck, UserCheck } from 'lucide-react';

interface HeaderProps {
  currentMsme: MsmeProfile;
  onSwitchMsme: (msmeId: string) => void;
  allMsmes: MsmeProfile[];
}

export const Header: React.FC<HeaderProps> = ({ currentMsme, onSwitchMsme, allMsmes }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-idbi-blue to-idbi-cyan flex items-center justify-center shadow-md shadow-idbi-cyan/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white">IDBI Health</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-idbi-blue/30 text-idbi-cyan border border-idbi-cyan/30">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">MSME Self-Service Portal</p>
          </div>
        </div>

        {/* Profile Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
          <UserCheck className="w-3.5 h-3.5 text-idbi-cyan shrink-0" />
          <select
            value={currentMsme.msmeId}
            onChange={(e) => onSwitchMsme(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer max-w-[110px] truncate"
            title="Switch demo profile"
          >
            {allMsmes.map((m) => (
              <option key={m.msmeId} value={m.msmeId} className="bg-slate-950 text-slate-200">
                {m.businessName.substring(0, 15)}... ({m.riskBand.split('_')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
