import { useState } from 'react';
import { Header } from './components/Header';
import { DashboardHome } from './components/DashboardHome';
import { ReasonCodesView } from './components/ReasonCodesView';
import { ConsentManager } from './components/ConsentManager';
import { ScoreBoostSimulator } from './components/ScoreBoostSimulator';
import { MOCK_MSMES, INITIAL_CONSENTS } from './data/mockMsme';
import type { MsmeProfile, ConsentRecord } from './types';
import { Home, HelpCircle, ShieldCheck, Sparkles } from 'lucide-react';

export default function App() {
  const [currentMsme, setCurrentMsme] = useState<MsmeProfile>(MOCK_MSMES[0]);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [consents, setConsents] = useState<ConsentRecord[]>(INITIAL_CONSENTS);

  const handleSwitchMsme = (msmeId: string) => {
    const found = MOCK_MSMES.find(m => m.msmeId === msmeId);
    if (found) {
      setCurrentMsme(found);
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-idbi-cyan/30 selection:text-idbi-cyan max-w-md mx-auto shadow-2xl border-x border-slate-900 relative">
      {/* Mobile Header */}
      <Header
        currentMsme={currentMsme}
        onSwitchMsme={handleSwitchMsme}
        allMsmes={MOCK_MSMES}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-6">
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
      </main>

      {/* Fixed Bottom Navigation Bar (PWA Mobile First) */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-md w-full bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 px-4 py-2 flex items-center justify-around z-50">
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
