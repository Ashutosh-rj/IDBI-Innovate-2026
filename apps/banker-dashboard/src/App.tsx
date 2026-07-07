import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PortfolioOverview } from './components/PortfolioOverview';
import { MsmeTable } from './components/MsmeTable';
import { ScorecardView } from './components/ScorecardView';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { MOCK_COHORT } from './data/mockCohort';
import type { MsmeProfile } from './types';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { fetchLiveCohort } from './services/apiClient';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedMsme, setSelectedMsme] = useState<MsmeProfile | null>(null);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [cohortData, setCohortData] = useState<MsmeProfile[]>(MOCK_COHORT);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (isLiveApi) {
      setIsLoadingLive(true);
      setLiveError(null);
      fetchLiveCohort(MOCK_COHORT)
        .then((liveProfiles) => {
          if (isMounted) {
            setCohortData(liveProfiles);
            setIsLoadingLive(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setLiveError("Failed to connect to live gateway (:8080). Displaying fallback cohort.");
            setIsLoadingLive(false);
          }
        });
    } else {
      setCohortData(MOCK_COHORT);
      setLiveError(null);
    }
    return () => {
      isMounted = false;
    };
  }, [isLiveApi]);

  useEffect(() => {
    if (selectedMsme) {
      const updated = cohortData.find((m) => m.msmeId === selectedMsme.msmeId);
      if (updated) setSelectedMsme(updated);
    }
  }, [cohortData]);

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
            <div className={`w-2.5 h-2.5 rounded-full ${isLiveApi ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <p className="text-xs md:text-sm text-slate-200 font-medium">
              <strong className="text-idbi-cyan">IDBI Innovate 2026 Audit-Grade POC:</strong> Operating on 100% real computations & TreeSHAP explainability. Zero hardcoded scores.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            Mode: {isLiveApi ? 'Live Gateway (:8080 / :8000)' : 'SGSDG Audit Cohort (Local)'}
          </span>
        </div>

        {liveError && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-xl flex items-center gap-3 text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{liveError}</span>
          </div>
        )}

        {/* Tab Routing with Live Loading State */}
        {isLoadingLive ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-slate-900/40 border border-idbi-cyan/20 rounded-2xl shadow-xl backdrop-blur">
            <div className="w-10 h-10 border-4 border-idbi-cyan border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-200">
              Connecting to Live API Gateway (:8080) & Executing TreeSHAP Inference...
            </p>
            <p className="text-xs text-slate-400">
              Computing multi-stream alternate data features across GST, UPI, AA, and EPFO.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <PortfolioOverview cohort={cohortData} onSelectMsme={handleSelectMsme} />
            )}

            {activeTab === 'directory' && (
              <MsmeTable cohort={cohortData} onSelectMsme={handleSelectMsme} />
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
                msme={selectedMsme || cohortData[0]}
                onClose={() => setActiveTab('directory')}
              />
            )}
          </>
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
