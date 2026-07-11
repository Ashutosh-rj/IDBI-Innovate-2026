import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardHome } from './components/DashboardHome';
import { ReasonCodesView } from './components/ReasonCodesView';
import { ConsentManager } from './components/ConsentManager';
import { ScoreBoostSimulator } from './components/ScoreBoostSimulator';
import { MOCK_MSMES, INITIAL_CONSENTS } from './data/mockMsme';
import type { MsmeProfile, ConsentRecord } from './types';
import { Home, HelpCircle, ShieldCheck, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchLiveMsmeScore } from './services/apiClient';

export default function App() {
  const [baseMsme, setBaseMsme] = useState<MsmeProfile>(MOCK_MSMES[0]);
  const [currentMsme, setCurrentMsme] = useState<MsmeProfile>(MOCK_MSMES[0]);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [consents, setConsents] = useState<ConsentRecord[]>(INITIAL_CONSENTS);

  // Live API & Judge Demo state
  const [isLiveApi, setIsLiveApi] = useState<boolean>(true); // Default ON to demonstrate live production architecture
  const [isJudgeDemo, setIsJudgeDemo] = useState<boolean>(true); // Default ON for 100% demo reliability
  const [dataSource, setDataSource] = useState<'GATEWAY_8080' | 'DIRECT_8000' | 'JUDGE_FALLBACK' | 'STATIC'>('STATIC');
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (isLiveApi) {
      setIsLoadingLive(true);
      setLiveError(null);
      fetchLiveMsmeScore(baseMsme, isLiveApi, isJudgeDemo)
        .then((res) => {
          if (isMounted) {
            setCurrentMsme(res.profile);
            setDataSource(res.source);
            setIsLoadingLive(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setLiveError(err.message || 'Live backend connection failed.');
            setCurrentMsme(baseMsme);
            setDataSource('STATIC');
            setIsLoadingLive(false);
          }
        });
    } else {
      setCurrentMsme(baseMsme);
      setDataSource('STATIC');
      setLiveError(null);
    }
    return () => {
      isMounted = false;
    };
  }, [baseMsme, isLiveApi, isJudgeDemo]);

  const handleSwitchMsme = (msmeId: string) => {
    const found = MOCK_MSMES.find(m => m.msmeId === msmeId);
    if (found) {
      setBaseMsme(found);
      setActiveTab('home');
    }
  };

  const handleGrantConsent = (newConsent: ConsentRecord) => {
    setConsents([newConsent, ...consents]);
  };

  const handleRevokeConsent = (handle: string) => {
    setConsents(consents.map(c => c.consentHandle === handle ? { ...c, status: 'REVOKED' } : c));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-idbi-blue/20 selection:text-idbi-navy max-w-md mx-auto shadow-2xl border-x border-slate-200 relative pb-20">
      {/* Mobile Header with Live Toggle */}
      <Header
        currentMsme={currentMsme}
        onSwitchMsme={handleSwitchMsme}
        allMsmes={MOCK_MSMES}
        isLiveApi={isLiveApi}
        setIsLiveApi={setIsLiveApi}
        isJudgeDemo={isJudgeDemo}
        setIsJudgeDemo={setIsJudgeDemo}
        dataSource={dataSource}
      />

      {/* Status / Fallback Alert Box */}
      {dataSource === 'JUDGE_FALLBACK' && (
        <div className="mx-4 mt-3 p-3 bg-purple-950/60 border border-purple-500/40 rounded-xl text-purple-200 text-xs flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-purple-400 shrink-0 animate-spin" />
          <span>
            <strong className="text-purple-300">Judge Demo Mode Active:</strong> Live Gateway is offline. Using automatic high-fidelity fallback inference so live stage demonstrations run smoothly without errors.
          </span>
        </div>
      )}

      {liveError && !isJudgeDemo && (
        <div className="mx-4 mt-3 p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{liveError}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-4">
        {isLoadingLive ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
            <div className="w-8 h-8 border-3 border-idbi-cyan border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-200">
              Querying API Gateway & TreeSHAP Explainer...
            </p>
            <p className="text-[10px] text-slate-400 max-w-xs">
              Synthesizing live features from GSTR-3B, UPI merchant flows, and ReBIT AA banking statement.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <DashboardHome msme={currentMsme} onNavigate={setActiveTab} />
            )}

            {activeTab === 'reasons' && (
              <ReasonCodesView
                msme={currentMsme}
                onBack={() => setActiveTab('home')}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'consents' && (
              <ConsentManager
                consents={consents}
                onGrantConsent={handleGrantConsent}
                onRevokeConsent={handleRevokeConsent}
                onBack={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'boost' && (
              <ScoreBoostSimulator
                msme={currentMsme}
                onBack={() => setActiveTab('home')}
              />
            )}
          </>
        )}
      </main>

      {/* Fixed Bottom Navigation Bar (PWA Mobile First) */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-md w-full bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 flex items-center justify-around z-50">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'home' ? 'text-idbi-cyan font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('reasons')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'reasons' ? 'text-idbi-cyan font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-[10px]">Why Score?</span>
        </button>

        <button
          onClick={() => setActiveTab('consents')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'consents' ? 'text-purple-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px]">AA Consents</span>
        </button>

        <button
          onClick={() => setActiveTab('boost')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'boost' ? 'text-idbi-cyan font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-[10px]">Boost Score</span>
        </button>
      </nav>
    </div>
  );
}
