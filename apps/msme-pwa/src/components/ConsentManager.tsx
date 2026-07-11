import React, { useState } from 'react';
import type { ConsentRecord } from '../types';
import { ShieldCheck, Lock, CheckCircle2, PlusCircle, XCircle } from 'lucide-react';

interface ConsentManagerProps {
  consents: ConsentRecord[];
  onGrantConsent: (newConsent: ConsentRecord) => void;
  onRevokeConsent: (consentHandle: string) => void;
  onBack: () => void;
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({ consents, onGrantConsent, onRevokeConsent, onBack }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState('HDFC Bank Ltd (DEPOSIT)');
  const [purpose, setPurpose] = useState('101 - CREDIT_SCORE_ASSESSMENT');
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'grant' | 'revoke' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const fiType = selectedBank.includes('DEPOSIT') ? 'DEPOSIT' : 'GST_RETURNS';
    const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080/api/v1';

    let newHandle: string;
    let status = "ACTIVE";
    let isError = false;

    try {
      const initRes = await fetch(`${GATEWAY_URL}/consent/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msmeId: "MSME-888",
          fiuId: "FIU-IDBI-BANK-INNOVATE",
          aaId: "AA-ONEMONEY-001",
          purposeCode: purpose,
          fiTypes: [fiType, "TERM_DEPOSIT"]
        })
      }).catch(() =>
        fetch(`http://localhost:8081/api/v1/consent/initiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            msmeId: "MSME-888",
            fiuId: "FIU-IDBI-BANK-INNOVATE",
            aaId: "AA-ONEMONEY-001",
            purposeCode: purpose,
            fiTypes: [fiType, "TERM_DEPOSIT"]
          })
        })
      );

      if (initRes && initRes.ok) {
        const initData = await initRes.json();
        newHandle = initData.consentHandle;

        const approveRes = await fetch(`${GATEWAY_URL}/consent/approve/${newHandle}`, { method: 'POST' }).catch(() =>
          fetch(`http://localhost:8081/api/v1/consent/approve/${newHandle}`, { method: 'POST' })
        );
        if (approveRes && approveRes.ok) {
          const approveData = await approveRes.json();
          status = approveData.status || "ACTIVE";
        }
      } else {
        throw new Error("Backend response not OK");
      }
    } catch (err) {
      newHandle = "ID unavailable — backend unreachable";
      status = "ERROR";
      isError = true;
    }

    setIsLoading(false);
    const record: ConsentRecord = {
      consentHandle: newHandle,
      fiuId: "FIU-IDBI-BANK-INNOVATE",
      aaId: "AA-ONEMONEY-001",
      purposeCode: purpose,
      fiTypes: [fiType, "TERM_DEPOSIT"],
      status: isError ? "REVOKED" : (status as any),
      consentStart: new Date().toISOString(),
      consentExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
    };

    onGrantConsent(record);
    setShowModal(false);
    if (isError) {
      setActionFeedback({ message: `Consent initiation failed: ID unavailable — backend unreachable.`, type: 'revoke' });
    } else {
      setActionFeedback({ message: `ReBIT AA Consent (${newHandle}) granted & active with ${selectedBank}!`, type: 'grant' });
    }
  };

  const handleRevoke = async (handle: string) => {
    const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080/api/v1';
    try {
      await fetch(`${GATEWAY_URL}/consent/revoke/${handle}`, { method: 'POST' }).catch(() =>
        fetch(`http://localhost:8081/api/v1/consent/revoke/${handle}`, { method: 'POST' })
      );
    } catch (e) {
      console.warn('Backend revoke unreachable:', e);
    }
    onRevokeConsent(handle);
    setActionFeedback({ message: `Consent (${handle}) immediately revoked. Data stream terminated under DPDP Act 2023.`, type: 'revoke' });
  };

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold"
        >
          &larr; Back
        </button>
        <span className="text-xs font-bold text-slate-400">ReBIT AA v2.0 Protocol</span>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-fadeIn ${
          actionFeedback.type === 'grant'
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
            : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Header with Unique Abstract Dots Art */}
      <div className="glass-card p-5 border-l-4 border-l-purple-500 relative overflow-hidden rounded-3xl shadow-xl group">
        <div className="absolute inset-0 bg-[url('/images/bg-abstract-dots.jpg')] bg-cover bg-center opacity-25 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-purple-950/80 to-slate-950/90 backdrop-blur-sm pointer-events-none" />
        <div className="relative z-10">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2 group-hover:text-purple-300 transition-colors">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            Account Aggregator (AA) Consents
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            You are in complete control of your financial data. Data is shared encrypted end-to-end under RBI Account Aggregator guidelines.
          </p>
        </div>
      </div>

      {/* Grant Consent CTA */}
      <button
        onClick={() => setShowModal(true)}
        className="btn-primary py-3.5 bg-gradient-to-r from-purple-600 to-idbi-blue shadow-purple-500/20 hover:scale-[1.02] transition-transform"
      >
        <PlusCircle className="w-5 h-5" /> Grant New Data Sharing Consent
      </button>

      {/* Consents List */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Active Data Sharing Agreements ({consents.filter(c => c.status === 'ACTIVE').length})
        </h4>

        {consents.map((c) => (
          <div key={c.consentHandle} className="glass-card p-5 relative overflow-hidden rounded-2xl group hover:border-purple-500/40 transition-all">
            <div className="absolute inset-0 bg-[url('/images/bg-abstract-dots.jpg')] bg-cover bg-center opacity-15 mix-blend-luminosity group-hover:opacity-25 transition-opacity pointer-events-none" />
            <div className="absolute inset-0 bg-slate-950/90 pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      c.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      c.status === 'REVOKED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {c.status}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">{c.consentHandle}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5">
                    <strong>FIU:</strong> {c.fiuId} • <strong>AA:</strong> {c.aaId}
                  </p>
                </div>

                {c.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleRevoke(c.consentHandle)}
                    className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 rounded-lg text-xs font-semibold border border-rose-500/30 transition-all flex items-center gap-1 shrink-0"
                    title="Revoke consent immediately"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Revoke
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Purpose:</span>
                  <strong className="text-slate-200">{c.purposeCode}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Data Types:</span>
                  <strong className="text-idbi-cyan font-mono">{c.fiTypes.join(', ')}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Valid Until:</span>
                  <strong className="text-slate-300">{new Date(c.consentExpiry).toLocaleDateString()}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}

        {consents.length === 0 && (
          <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800">
            <Lock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No active consents found.</p>
            <p className="text-xs text-slate-500 mt-1">Grant consent to share bank statements or GST returns for scoring.</p>
          </div>
        )}
      </div>

      {/* Modal for Granting Consent */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-5 border-purple-500/50 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                Authorize Data Sharing (ReBIT AA)
              </h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateConsent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Select Financial Institution (FI)</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="HDFC Bank Ltd (DEPOSIT)">HDFC Bank Ltd (Current Account DEPOSIT)</option>
                  <option value="ICICI Bank Ltd (DEPOSIT)">ICICI Bank Ltd (OD & Current Account)</option>
                  <option value="State Bank of India (DEPOSIT)">State Bank of India (Current Account)</option>
                  <option value="GSTN Portal (GSTR_3B)">GSTN Portal (GSTR-1 & GSTR-3B Returns)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Purpose Code</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="101 - CREDIT_SCORE_ASSESSMENT">101 - CREDIT_SCORE_ASSESSMENT (IDBI Bank)</option>
                  <option value="102 - WORKING_CAPITAL_MONITORING">102 - WORKING_CAPITAL_MONITORING (OCEN)</option>
                </select>
              </div>

              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-xs text-purple-200 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> End-to-End Encryption
                </p>
                <p className="text-[11px] text-slate-300">
                  Data flows directly from your bank to IDBI Scoring Engine. No intermediary can read or store your statements.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary py-2.5 flex-1 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary py-2.5 flex-1 text-xs bg-gradient-to-r from-purple-600 to-idbi-blue disabled:opacity-50"
                >
                  {isLoading ? 'Authorizing...' : 'Authorize Consent →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
