import React, { useState } from 'react';
import { ShieldCheck, Activity, Users, Layers, Cpu, FileText, Compass, Database, Menu, X } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLiveApi: boolean;
  setIsLiveApi: (live: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isLiveApi, setIsLiveApi }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Portfolio Overview', icon: Activity },
    { id: 'directory', label: 'MSME Cohort & Scorecards', icon: Users },
    { id: 'simulate', label: 'What-If Simulator', icon: Layers },
    { id: 'architecture', label: 'System Architecture', icon: Cpu },
    { id: 'audit', label: 'RBI Audit & Compliance', icon: FileText },
    { id: 'journey', label: 'NTC Credit Journey', icon: Compass },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-gradient-to-br from-idbi-blue via-idbi-cyan to-emerald-500 flex items-center justify-center shadow-lg shadow-idbi-cyan/20 shrink-0">
              <ShieldCheck className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg lg:text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-idbi-cyan bg-clip-text text-transparent">
                  IDBI Innovate 2026
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-idbi-blue/30 text-idbi-cyan border border-idbi-cyan/30">
                  Track 03
                </span>
              </div>
              <p className="text-[11px] lg:text-xs text-slate-400 font-medium hidden sm:block">
                MSME Financial Health Score Platform • AI/ML & Alternate Data Engine
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-idbi-blue to-idbi-cyan text-white shadow-md shadow-idbi-blue/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Mode Toggle & Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:gap-3">
            <button
              onClick={() => setIsLiveApi(!isLiveApi)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all duration-200 ${
                isLiveApi
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/10'
              }`}
              title="Toggle between Live API Gateway (Port 8080) and Standalone SGSDG Audit Cohort"
            >
              <Database className="w-3.5 h-3.5 animate-pulse shrink-0" />
              <span className="hidden sm:inline">{isLiveApi ? 'Live API Gateway :8080' : 'Audit Cohort (SGSDG)'}</span>
              <span className="sm:hidden">{isLiveApi ? 'Live API' : 'Audit Cohort'}</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-slate-900/95 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1.5 animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-idbi-blue to-idbi-cyan text-white shadow-md shadow-idbi-blue/30'
                    : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
