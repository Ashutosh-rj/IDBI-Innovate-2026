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
    <header className="sticky top-0 z-50 bg-[#002B49] border-b border-idbi-blue/30 relative shadow-md text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between min-h-[5.5rem] py-3 gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-[#001f35] border border-idbi-blue/40 flex items-center justify-center shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6 lg:w-7 lg:h-7 text-idbi-cyan" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg lg:text-xl font-extrabold tracking-tight text-white whitespace-nowrap">
                  IDBI Innovate 2026
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-idbi-gold/20 text-idbi-gold border border-idbi-gold/40 shrink-0">
                  Track 03
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-gradient-to-r from-amber-400 to-amber-300 text-[#002B49] border border-amber-200 shadow-sm shrink-0">
                  ★ Team v22
                </span>
              </div>
              <div className="text-xs text-slate-200 font-medium mt-1 leading-relaxed flex items-center gap-1.5 flex-wrap">
                <span>MSME Financial Health Score Platform</span>
                <span className="text-idbi-cyan font-bold hidden md:inline">•</span>
                <span className="text-amber-300 font-semibold italic">"Every version is better than the last."</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden xl:flex items-center gap-1 bg-[#001f35] p-1.5 rounded-xl border border-idbi-blue/40">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-idbi-cyan ${
                    isActive
                      ? 'bg-idbi-blue text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-idbi-blue/20'
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 ${
                isLiveApi
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                  : 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm'
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
              className="xl:hidden p-2 rounded-lg bg-[#001f35] border border-idbi-blue/40 text-slate-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-idbi-cyan"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#002B49] border-b border-idbi-blue/40 px-4 pt-2 pb-4 space-y-1.5 animate-fadeIn text-white">
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
                className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-idbi-cyan ${
                  isActive
                    ? 'bg-idbi-blue text-white shadow-sm'
                    : 'text-slate-200 hover:bg-[#001f35]'
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
