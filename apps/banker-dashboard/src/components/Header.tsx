import React from 'react';
import { ShieldCheck, Activity, Users, Database, Layers } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLiveApi: boolean;
  setIsLiveApi: (live: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isLiveApi, setIsLiveApi }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-idbi-blue via-idbi-cyan to-emerald-500 flex items-center justify-center shadow-lg shadow-idbi-cyan/20">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-idbi-cyan bg-clip-text text-transparent">
                  IDBI Innovate 2026
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-idbi-blue/30 text-idbi-cyan border border-idbi-cyan/30">
                  Track 03
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                MSME Financial Health Score Platform • AI/ML & Alternate Data Engine
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-idbi-blue to-idbi-cyan text-white shadow-md shadow-idbi-blue/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              Portfolio Overview
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'directory'
                  ? 'bg-gradient-to-r from-idbi-blue to-idbi-cyan text-white shadow-md shadow-idbi-blue/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              MSME Cohort & Scorecards
            </button>
            <button
              onClick={() => setActiveTab('simulate')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'simulate'
                  ? 'bg-gradient-to-r from-idbi-blue to-idbi-cyan text-white shadow-md shadow-idbi-blue/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              What-If Simulator
            </button>
          </nav>

          {/* Mode Toggle & Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLiveApi(!isLiveApi)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all duration-200 ${
                isLiveApi
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/10'
              }`}
              title="Toggle between Live API Gateway (Port 8080) and Standalone SGSDG Audit Cohort"
            >
              <Database className="w-3.5 h-3.5 animate-pulse" />
              {isLiveApi ? 'Live API Gateway :8080' : 'Audit Cohort (SGSDG)'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
