import React from 'react';
import type { MsmeProfile } from '../types';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, HelpCircle, Download, Share2, Award, Zap } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface ScorecardViewProps {
  msme: MsmeProfile;
  onBack: () => void;
  onSimulate: (msme: MsmeProfile) => void;
}

export const ScorecardView: React.FC<ScorecardViewProps> = ({ msme, onBack, onSimulate }) => {
  const radarData = [
    { subject: 'Tax Compliance (30%)', A: msme.subScores.taxComplianceScore, fullMark: 100 },
    { subject: 'Cash Flow Velocity (25%)', A: msme.subScores.cashFlowVelocityScore, fullMark: 100 },
    { subject: 'Payroll Stability (20%)', A: msme.subScores.payrollStabilityScore, fullMark: 100 },
    { subject: 'Vintage & Stability (10%)', A: msme.subScores.businessVintageScore, fullMark: 100 },
    { subject: 'Liquidity Buffer (15%)', A: msme.subScores.liquidityBufferScore, fullMark: 100 },
  ];

  const positiveReasons = msme.topReasonCodes.filter(r => r.impact === 'POSITIVE');
  const negativeReasons = msme.topReasonCodes.filter(r => r.impact === 'NEGATIVE');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Bar / Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Applicant Directory
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSimulate(msme)}
            className="btn-primary"
          >
            <Zap className="w-4 h-4" /> Run What-If Simulation
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 flex items-center gap-2 transition-all shadow-2xs"
          >
            <Download className="w-4 h-4" /> Print / Save Scorecard PDF
          </button>
        </div>
      </div>

      {/* Header Profile Summary with Clean Enterprise Holographic Accent */}
      <div className="glass-card p-8 border-t-4 border-t-idbi-blue relative overflow-hidden rounded-3xl shadow-sm group">
        <div className="absolute inset-0 bg-white/95 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#001f35] border border-idbi-blue/40 flex items-center justify-center text-2xl font-extrabold text-white shadow-sm">
              {msme.businessName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-extrabold text-slate-900">{msme.businessName}</h2>
                <span className={msme.riskBand === 'PRIME_RISK' ? 'badge-prime' : msme.riskBand === 'MODERATE_RISK' ? 'badge-moderate' : 'badge-high'}>
                  {msme.riskBand.replace('_', ' ')}
                </span>
                {msme.isNtcThinFile && <span className="badge-ntc">NTC Thin-File</span>}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {msme.sector} • Udyam ID: <strong className="text-slate-800 font-mono">{msme.udyamNumber}</strong> • Reg Date: {msme.registrationDate}
              </p>
              <div className="flex items-center gap-6 mt-4 text-xs text-slate-600">
                <span>Monthly Turnover: <strong className="text-slate-900 font-semibold">₹{(msme.keyMetrics.monthlyTurnover / 100000).toFixed(2)} Lakhs</strong></span>
                <span>GSTR-3B Compliance: <strong className="text-slate-900 font-semibold">{(msme.keyMetrics.gstr3bRegularity * 100).toFixed(0)}%</strong></span>
                <span>EPF Active Workforce: <strong className="text-slate-900 font-semibold">{msme.keyMetrics.epfActiveMembers} members</strong></span>
              </div>
            </div>
          </div>

          {/* Main Score Gauge */}
          <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Financial Health Score</p>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className={`text-5xl font-black tracking-tight ${
                  msme.healthScore >= 700 ? 'text-emerald-700' : msme.healthScore >= 600 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {msme.healthScore}
                </span>
                <span className="text-sm font-semibold text-slate-500">/ 900</span>
              </div>
              <p className={`text-[11px] ${msme.healthScore >= 700 ? 'text-emerald-700' : msme.healthScore >= 600 ? 'text-amber-700' : 'text-rose-700'} mt-1 font-semibold flex items-center justify-center gap-1`}>
                <TrendingUp className="w-3.5 h-3.5" /> {
                  msme.healthScore >= 750 ? `Top 10% in ${msme.sector}` :
                  msme.healthScore >= 700 ? `Top 20% in ${msme.sector}` :
                  msme.healthScore >= 640 ? `Top 40% in ${msme.sector}` :
                  `Bottom 35% in ${msme.sector}`
                }
              </p>
            </div>

            <div className="h-12 w-px bg-slate-200" />

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">12M Default Probability</p>
              <h4 className="text-3xl font-bold text-slate-900 mt-1">{(msme.defaultProbability12m * 100).toFixed(2)}%</h4>
              <p className="text-[11px] text-slate-500 mt-1">Isotonic Calibrated PD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Scores & Radar Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Radar Chart */}
        <div className="lg:col-span-5 glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-idbi-navy" />
              5-Dimension Sub-Score Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-1">Weighted alternate data vectors per master build specification</p>
          </div>
          <div className="h-72 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={10} />
                <Radar name="Sub-Score" dataKey="A" stroke="#005A9C" fill="#005A9C" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="p-3 bg-idbi-blue/10 rounded-xl border border-idbi-blue/20 text-xs text-idbi-navy flex items-center justify-between font-medium">
            <span>Data Quality Index (DQI):</span>
            <strong className="font-bold text-slate-900">{msme.subScores.dataQualityScore}% (High Confidence)</strong>
          </div>
        </div>

        {/* Sub-Score Bars */}
        <div className="lg:col-span-7 glass-card p-6 space-y-5">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Dimension Performance & Weightage</h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Tax Compliance & Regularity (GSTR-1, 2A/2B, 3B) • <span className="text-idbi-navy font-semibold">30% Weight</span></span>
                <span className="text-slate-900 font-extrabold font-mono">{msme.subScores.taxComplianceScore} / 100</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-idbi-navy h-full rounded-full" style={{ width: `${msme.subScores.taxComplianceScore}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Cash Flow Velocity & Stability (UPI / Account Aggregator) • <span className="text-idbi-navy font-semibold">25% Weight</span></span>
                <span className="text-slate-900 font-extrabold font-mono">{msme.subScores.cashFlowVelocityScore} / 100</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${msme.subScores.cashFlowVelocityScore}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Payroll Compliance & Stability (EPFO Contributions) • <span className="text-idbi-navy font-semibold">20% Weight</span></span>
                <span className="text-slate-900 font-extrabold font-mono">{msme.subScores.payrollStabilityScore} / 100</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-idbi-blue h-full rounded-full" style={{ width: `${msme.subScores.payrollStabilityScore}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Liquidity & Buffer Management (AA OD Limit & Bounces) • <span className="text-idbi-navy font-semibold">15% Weight</span></span>
                <span className="text-slate-900 font-extrabold font-mono">{msme.subScores.liquidityBufferScore} / 100</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-amber-600 h-full rounded-full" style={{ width: `${msme.subScores.liquidityBufferScore}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Business Vintage & Sector Trajectory • <span className="text-idbi-navy font-semibold">10% Weight</span></span>
                <span className="text-slate-900 font-extrabold font-mono">{msme.subScores.businessVintageScore} / 100</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${msme.subScores.businessVintageScore}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RBI & Bank-Audit Compliant Reason Codes Section */}
      <div className="glass-card p-6 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-idbi-navy" />
            RBI Audit-Compliant Plain-Language Reason Codes & Actionable Advice
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Every score change is mathematically backed by exact TreeSHAP attributions. No black-box decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Positive Drivers */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Positive Score Drivers (SHAP Gains)
            </h4>
            {positiveReasons.length > 0 ? (
              positiveReasons.map((reason, idx) => (
                <div key={idx} className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                      {reason.code} ({reason.category})
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700 font-mono">+{reason.shapValue} SHAP pts</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{reason.description}</p>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-xs text-slate-700 shadow-2xs">
                    <strong className="text-emerald-800 font-semibold">Banker Note:</strong> {reason.advice}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No primary positive drivers recorded for this profile.</p>
            )}
          </div>

          {/* Negative Drivers / Areas for Improvement */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-rose-800 flex items-center gap-2 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Negative Score Drivers & Actionable Advice
            </h4>
            {negativeReasons.length > 0 ? (
              negativeReasons.map((reason, idx) => (
                <div key={idx} className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-bold font-mono">
                      {reason.code} ({reason.category})
                    </span>
                    <span className="text-xs font-extrabold text-rose-700 font-mono">{reason.shapValue} SHAP pts</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{reason.description}</p>
                  <div className="p-2.5 bg-white rounded-xl border border-rose-200 text-xs text-slate-700 shadow-2xs">
                    <strong className="text-rose-800 font-semibold">Actionable Guidance:</strong> {reason.advice}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900">Zero Negative Risk Drivers!</p>
                <p className="text-xs text-slate-600 mt-1">This applicant has an unblemished compliance and credit record.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OCEN 4.0 / ULI Credit Passport Box */}
      {msme.ocenLspPayload && (
        <div className="glass-card p-6 bg-white border border-idbi-blue/40 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-idbi-blue/10 rounded-xl text-idbi-navy">
                <Share2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-slate-900">OCEN 4.0 & ULI Credit Passport Registry</h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                    {msme.ocenLspPayload.verificationStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Immutable scorecard published to Open Credit Enablement Network (OCEN) via LSP [{msme.ocenLspPayload.lspId}]
                </p>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 shadow-2xs">
              Passport Ref: <strong className="text-idbi-navy">{msme.ocenLspPayload.creditPassportId}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
