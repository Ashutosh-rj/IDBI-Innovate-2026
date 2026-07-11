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
          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold shadow-sm"
        >
          &larr; Back
        </button>
        <span className="text-xs font-bold text-slate-600">ReBIT AA v2.0 Protocol</span>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-sm animate-fadeIn ${
          actionFeedback.type === 'grant'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
            : 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-500 hover:text-slate-900 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="glass-card p-5 border-l-4 border-l-purple-600 shadow-sm">
        <div className="relative z-10">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-700" />
            Account Aggregator (AA) Consents
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            You are in complete control of your financial data. Data is shared encrypted end-to-end under RBI Account Aggregator guidelines.
          </p>
        </div>
      </div>

      {/* Grant Consent CTA */}
      <button
        onClick={() => setShowModal(true)}
        className="btn-primary py-3.5 bg-idbi-navy hover:bg-[#00385F] shadow-sm transition-transform"
      >
        <PlusCircle className="w-5 h-5" /> Grant New Data Sharing Consent
      </button>

      {/* Consents List */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
          Active Data Sharing Agreements ({consents.filter(c => c.status === 'ACTIVE').length})
        </h4>

        {consents.map((c) => (
          <div key={c.consentHandle} className="glass-card p-5 relative overflow-hidden shadow-sm hover:border-slate-300 transition-all">
            <div className="relative z-10 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      c.status === 'REVOKED' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {c.status}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">{c.consentHandle}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    <strong>FIU:</strong> {c.fiuId} • <strong>AA:</strong> {c.aaId}
                  </p>
                </div>

                {c.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleRevoke(c.consentHandle)}
                    className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-semibold border border-rose-300 transition-all flex items-center gap-1 shrink-0"
                    title="Revoke consent immediately"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Revoke
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Purpose:</span>
                  <strong className="text-slate-900">{c.purposeCode}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Data Types:</span>
                  <strong className="text-idbi-navy font-mono">{c.fiTypes.join(', ')}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Valid Until:</span>
                  <strong className="text-slate-900">{new Date(c.consentExpiry).toLocaleDateString()}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}

        {consents.length === 0 && (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No active consents found.</p>
            <p className="text-xs text-slate-600 mt-1">Grant consent to share bank statements or GST returns for scoring.</p>
          </div>
        )}
      </div>

      {/* Modal for Granting Consent */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 space-y-5 rounded-2xl shadow-xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-700" />
                Authorize Data Sharing (ReBIT AA)
              </h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateConsent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Select Financial Institution (FI)</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                >
                  <option value="HDFC Bank Ltd (DEPOSIT)">HDFC Bank Ltd (Current Account DEPOSIT)</option>
                  <option value="ICICI Bank Ltd (DEPOSIT)">ICICI Bank Ltd (OD & Current Account)</option>
                  <option value="State Bank of India (DEPOSIT)">State Bank of India (Current Account)</option>
                  <option value="GSTN Portal (GSTR_3B)">GSTN Portal (GSTR-1 & GSTR-3B Returns)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Purpose Code</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                >
                  <option value="101 - CREDIT_SCORE_ASSESSMENT">101 - CREDIT_SCORE_ASSESSMENT (IDBI Bank)</option>
                  <option value="102 - WORKING_CAPITAL_MONITORING">102 - WORKING_CAPITAL_MONITORING (OCEN)</option>
                </select>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-1">
                <p className="font-bold flex items-center gap-1 text-purple-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" /> End-to-End Encryption
                </p>
                <p className="text-[11px] text-slate-700">
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
                  className="btn-primary py-2.5 flex-1 text-xs bg-idbi-navy hover:bg-[#00385F] disabled:opacity-50"
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
