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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Applicant Directory
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSimulate(msme)}
            className="px-4 py-2 bg-gradient-to-r from-idbi-blue to-idbi-cyan text-white rounded-xl text-xs font-semibold shadow-lg shadow-idbi-blue/20 hover:shadow-idbi-cyan/40 transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" /> Run What-If Simulation
          </button>
          <button
            onClick={() => alert(`Exporting audit-grade PDF scorecard for ${msme.businessName}...`)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" /> Export Scorecard PDF
          </button>
        </div>
      </div>

      {/* Header Profile Summary */}
      <div className="glass-card p-8 border-t-4 border-t-idbi-cyan">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-idbi-navy via-idbi-blue to-idbi-cyan flex items-center justify-center text-2xl font-extrabold text-white shadow-xl">
              {msme.businessName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-extrabold text-white">{msme.businessName}</h2>
                <span className={msme.riskBand === 'PRIME_RISK' ? 'badge-prime' : msme.riskBand === 'MODERATE_RISK' ? 'badge-moderate' : 'badge-high'}>
                  {msme.riskBand.replace('_', ' ')}
                </span>
                {msme.isNtcThinFile && <span className="badge-ntc">NTC Thin-File</span>}
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {msme.sector} • Udyam ID: <strong className="text-slate-200 font-mono">{msme.udyamNumber}</strong> • Reg Date: {msme.registrationDate}
              </p>
              <div className="flex items-center gap-6 mt-4 text-xs text-slate-400">
                <span>Monthly Turnover: <strong className="text-white">₹{(msme.keyMetrics.monthlyTurnover / 100000).toFixed(2)} Lakhs</strong></span>
                <span>GSTR-3B Compliance: <strong className="text-white">{(msme.keyMetrics.gstr3bRegularity * 100).toFixed(0)}%</strong></span>
                <span>EPF Active Workforce: <strong className="text-white">{msme.keyMetrics.epfActiveMembers} members</strong></span>
              </div>
            </div>
          </div>

          {/* Main Score Gauge */}
          <div className="flex items-center gap-6 bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80">
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Financial Health Score</p>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className={`text-5xl font-black tracking-tight ${
                  msme.healthScore >= 700 ? 'text-emerald-400' : msme.healthScore >= 600 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {msme.healthScore}
                </span>
                <span className="text-sm font-semibold text-slate-500">/ 900</span>
              </div>
              <p className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center justify-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Top 15% in {msme.sector}
              </p>
            </div>

            <div className="h-12 w-px bg-slate-800" />

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">12M Default Probability</p>
              <h4 className="text-3xl font-bold text-white mt-1">{(msme.defaultProbability12m * 100).toFixed(2)}%</h4>
              <p className="text-[11px] text-slate-400 mt-1">Isotonic Calibrated PD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Scores & Radar Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Radar Chart */}
        <div className="lg:col-span-5 glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-idbi-cyan" />
              5-Dimension Sub-Score Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-1">Weighted alternate data vectors per master build specification</p>
          </div>
          <div className="h-72 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={10} />
                <Radar name="Sub-Score" dataKey="A" stroke="#00A3E0" fill="#00A3E0" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="p-3 bg-idbi-blue/10 rounded-xl border border-idbi-cyan/20 text-xs text-idbi-cyan flex items-center justify-between">
            <span>Data Quality Index (DQI):</span>
            <strong className="font-bold text-white">{msme.subScores.dataQualityScore}% (High Confidence)</strong>
          </div>
        </div>

        {/* Sub-Score Bars */}
        <div className="lg:col-span-7 glass-card p-6 space-y-5">
          <h3 className="text-lg font-bold text-white mb-4">Dimension Performance & Weightage</h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Tax Compliance & Regularity (GSTR-1, 2A/2B, 3B) • <span className="text-idbi-cyan">30% Weight</span></span>
                <span className="text-white font-bold">{msme.subScores.taxComplianceScore} / 100</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-idbi-blue to-idbi-cyan h-full rounded-full" style={{ width: `${msme.subScores.taxComplianceScore}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Cash Flow Velocity & Stability (UPI / Account Aggregator) • <span className="text-idbi-cyan">25% Weight</span></span>
                <span className="text-white font-bold">{msme.subScores.cashFlowVelocityScore} / 100</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-idbi-blue to-emerald-500 h-full rounded-full" style={{ width: `${msme.subScores.cashFlowVelocityScore}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Payroll Compliance & Stability (EPFO Contributions) • <span className="text-idbi-cyan">20% Weight</span></span>
                <span className="text-white font-bold">{msme.subScores.payrollStabilityScore} / 100</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-idbi-blue to-idbi-cyan h-full rounded-full" style={{ width: `${msme.subScores.payrollStabilityScore}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Liquidity & Buffer Management (AA OD Limit & Bounces) • <span className="text-idbi-cyan">15% Weight</span></span>
                <span className="text-white font-bold">{msme.subScores.liquidityBufferScore} / 100</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full" style={{ width: `${msme.subScores.liquidityBufferScore}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Business Vintage & Sector Trajectory • <span className="text-idbi-cyan">10% Weight</span></span>
                <span className="text-white font-bold">{msme.subScores.businessVintageScore} / 100</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-purple-500 to-idbi-cyan h-full rounded-full" style={{ width: `${msme.subScores.businessVintageScore}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RBI & Bank-Audit Compliant Reason Codes Section */}
      <div className="glass-card p-6 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-idbi-cyan" />
            RBI Audit-Compliant Plain-Language Reason Codes & Actionable Advice
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Every score change is mathematically backed by exact TreeSHAP attributions. No black-box decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Positive Drivers */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle className="w-4 h-4" /> Positive Score Drivers (SHAP Gains)
            </h4>
            {positiveReasons.length > 0 ? (
              positiveReasons.map((reason, idx) => (
                <div key={idx} className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                      {reason.code} ({reason.category})
                    </span>
                    <span className="text-xs font-extrabold text-emerald-400">+{reason.shapValue} SHAP pts</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{reason.description}</p>
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-emerald-500/20 text-xs text-slate-300">
                    <strong className="text-emerald-400 font-semibold">Banker Note:</strong> {reason.advice}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No primary positive drivers recorded for this profile.</p>
            )}
          </div>

          {/* Negative Drivers / Areas for Improvement */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> Negative Score Drivers & Actionable Advice
            </h4>
            {negativeReasons.length > 0 ? (
              negativeReasons.map((reason, idx) => (
                <div key={idx} className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-xs font-bold font-mono">
                      {reason.code} ({reason.category})
                    </span>
                    <span className="text-xs font-extrabold text-rose-400">{reason.shapValue} SHAP pts</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{reason.description}</p>
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-rose-500/20 text-xs text-slate-300">
                    <strong className="text-rose-400 font-semibold">Actionable Guidance:</strong> {reason.advice}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">Zero Negative Risk Drivers!</p>
                <p className="text-xs text-slate-400 mt-1">This applicant has an unblemished compliance and credit record.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OCEN 4.0 / ULI Credit Passport Box */}
      {msme.ocenLspPayload && (
        <div className="glass-card p-6 bg-gradient-to-r from-idbi-navy/40 via-slate-900 to-slate-900 border-idbi-cyan/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-idbi-cyan/20 rounded-2xl text-idbi-cyan">
                <Share2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-white">OCEN 4.0 & ULI Credit Passport Registry</h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase">
                    {msme.ocenLspPayload.verificationStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Immutable scorecard published to Open Credit Enablement Network (OCEN) via LSP [{msme.ocenLspPayload.lspId}]
                </p>
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
              Passport Ref: <strong className="text-idbi-cyan">{msme.ocenLspPayload.creditPassportId}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
