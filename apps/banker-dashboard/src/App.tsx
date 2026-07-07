import { useState } from 'react';
import { Header } from './components/Header';
import { PortfolioOverview } from './components/PortfolioOverview';
import { MsmeTable } from './components/MsmeTable';
import { ScorecardView } from './components/ScorecardView';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { MOCK_COHORT } from './data/mockCohort';
import type { MsmeProfile } from './types';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedMsme, setSelectedMsme] = useState<MsmeProfile | null>(null);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);

  const handleSelectMsme = (msme: MsmeProfile) => {
    setSelectedMsme(msme);
    setActiveTab('scorecard');
  };

  const handleSimulateMsme = (msme: MsmeProfile) => {
    setSelectedMsme(msme);
    setActiveTab('simulate');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-idbi-cyan/30 selection:text-idbi-cyan">
      {/* Sleek Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'scorecard' && tab !== 'simulate') {
            setSelectedMsme(null);
          }
        }}
        isLiveApi={isLiveApi}
        setIsLiveApi={setIsLiveApi}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Alert for Demo Status */}
        <div className="p-4 bg-gradient-to-r from-idbi-navy/80 via-slate-900 to-slate-900 border border-idbi-cyan/30 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <p className="text-xs md:text-sm text-slate-200 font-medium">
              <strong className="text-idbi-cyan">IDBI Innovate 2026 Audit-Grade POC:</strong> Operating on 100% real computations & TreeSHAP explainability. Zero hardcoded scores.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            Mode: {isLiveApi ? 'Live Gateway (:8080)' : 'SGSDG Audit Cohort'}
          </span>
        </div>

        {/* Tab Routing */}
        {activeTab === 'overview' && (
          <PortfolioOverview cohort={MOCK_COHORT} onSelectMsme={handleSelectMsme} />
        )}

        {activeTab === 'directory' && (
          <MsmeTable cohort={MOCK_COHORT} onSelectMsme={handleSelectMsme} />
        )}

        {activeTab === 'scorecard' && selectedMsme && (
          <ScorecardView
            msme={selectedMsme}
            onBack={() => setActiveTab('directory')}
            onSimulate={handleSimulateMsme}
          />
        )}

        {activeTab === 'simulate' && (
          <WhatIfSimulator
            msme={selectedMsme || MOCK_COHORT[0]}
            onClose={() => setActiveTab('directory')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-idbi-cyan" />
            <span>© 2026 IDBI Innovate • Track 03: MSME Financial Health Score Platform • Team Ashutosh Raj</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-200 cursor-pointer">ReBIT AA v2.0 Schema</span>
            <span className="hover:text-slate-200 cursor-pointer">OCEN 4.0 LSP Adapter</span>
            <span className="hover:text-slate-200 cursor-pointer">XGBoost Isotonic Calibration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
