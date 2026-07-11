import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, Database, TrendingUp, Award, Sparkles, Briefcase, Activity } from 'lucide-react';

export const CreditJourney: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const journeySteps = [
    {
      id: 0,
      phase: 'Step 1: The Credit Invisible State',
      title: 'New-to-Credit (NTC) / Thin-File MSME',
      badge: 'Traditional Status: REJECTED',
      badgeColor: 'badge-high',
      description: 'Radha Krishna Textiles has operated successfully for 3 years, but lacks audited financials, formal balance sheets, or a CIBIL commercial history. Under traditional rule-based banking models, their loan application for ₹15 Lakhs is auto-rejected due to zero credit bureau score.',
      metrics: {
        bureauScore: 'N/A (Thin File)',
        traditionalDecision: 'Auto-Reject',
        turnoverEvidence: 'Informal / Unverified',
        collateralRequired: '200% (Not Available)'
      },
      icon: Briefcase,
      accentColor: 'border-rose-500/50 bg-rose-500/10 text-rose-400'
    },
    {
      id: 1,
      phase: 'Step 2: ReBIT DEPA Digital Consent',
      title: 'Multi-Stream Alternate Data Ingestion',
      badge: 'Status: DATA CONNECTED',
      badgeColor: 'badge-moderate',
      description: 'The borrower initiates a 1-click Account Aggregator (AA) and GST consent via our PWA interface. Using ReBIT v2.0 secure schemas, our ingestion engine connects to their GSTR-3B filings, NPCI UPI merchant QR settlements, and EPFO employer records within seconds.',
      metrics: {
        gstr3bRegularity: '100% (12/12 months on-time)',
        upiMonthlySettlement: '₹4.8 Lakhs / month avg',
        epfHeadcount: '18 Active PF Contributors',
        odLimitUtilization: '42% (Healthy Buffer)'
      },
      icon: Database,
      accentColor: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
    },
    {
      id: 2,
      phase: 'Step 3: AI/ML Health Score Generation',
      title: 'Multi-Dimensional Feature Synthesis',
      badge: 'Status: HEALTH SCORE 742 / 900',
      badgeColor: 'badge-prime',
      description: 'Our XGBoost/LightGBM ensemble synthesizes 36 alternate data features into a unified 742 Health Score. TreeSHAP explains exactly why: steady GSTR-3B turnover (+65 pts) and zero cheque bounces (+45 pts) easily overcome the lack of vintage credit bureau history.',
      metrics: {
        generatedScore: '742 / 900 (Prime Risk)',
        calibrated12mPd: '1.42% Default Prob',
        taxComplianceScore: '88 / 100',
        cashFlowVelocity: '82 / 100'
      },
      icon: TrendingUp,
      accentColor: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
    },
    {
      id: 3,
      phase: 'Step 4: OCEN 4.0 Instant Disbursement',
      title: 'Automated ULI Underwriting & Sanction',
      badge: 'Status: LOAN SANCTIONED',
      badgeColor: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-3 py-1 rounded-full text-xs shadow-lg',
      description: 'The 742 Health Score cryptographic token is published via the OCEN 4.0 Loan Service Provider (LSP) adapter. The bank’s Unified Lending Interface (ULI) instantly sanctions a ₹18 Lakh working capital line at 10.85% p.a. (with a 1.25% digital health rebate)—all without physical branch visits or real estate collateral.',
      metrics: {
        sanctionLimit: '₹18,00,000 (Working Capital)',
        interestRate: '10.85% p.a. (-1.25% Rebate)',
        underwritingSLA: '< 3.2 Seconds End-to-End',
        collateralRequired: '0% (Unsecured Cash-Flow Backed)'
      },
      icon: Award,
      accentColor: 'border-purple-500/50 bg-purple-500/10 text-purple-400'
    }
  ];

  const current = journeySteps[currentStep];
  const Icon = current.icon;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="glass-card p-6 border-l-4 border-l-idbi-blue flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-idbi-blue/30 text-idbi-cyan border border-idbi-cyan/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Financial Inclusion Showcase
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Zero Collateral Pipeline
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-2">
            The NTC Thin-File to Prime Borrower Transformation
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Experience how our alternate data engine expands the bank's credit total addressable market (TAM) while keeping non-performing assets (NPA) under 1.5%. Walk through the real-time stages below.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              currentStep === 0 ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            Previous Stage
          </button>
          <button
            onClick={() => setCurrentStep(Math.min(journeySteps.length - 1, currentStep + 1))}
            disabled={currentStep === journeySteps.length - 1}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              currentStep === journeySteps.length - 1
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-idbi-blue to-idbi-cyan text-white shadow-lg shadow-idbi-blue/30 hover:shadow-idbi-cyan/40'
            }`}
          >
            {currentStep === journeySteps.length - 1 ? 'Transformation Complete' : 'Next Stage →'}
          </button>
        </div>
      </div>

      {/* Progress Stepper Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {journeySteps.map((step, idx) => {
          const StepIcon = step.icon;
          const isActive = idx === currentStep;
          const isPassed = idx < currentStep;
          return (
            <div
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-3.5 ${
                isActive
                  ? 'bg-slate-900/90 border-idbi-cyan shadow-lg shadow-idbi-cyan/15 scale-[1.02]'
                  : isPassed
                  ? 'bg-slate-900/50 border-emerald-500/40 text-slate-300'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500 hover:border-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-xl border ${
                isActive ? step.accentColor : isPassed ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 bg-slate-900 text-slate-600'
              }`}>
                {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Phase 0{idx + 1}</p>
                <p className={`text-xs font-bold truncate mt-0.5 ${isActive ? 'text-white' : isPassed ? 'text-slate-300' : 'text-slate-500'}`}>
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Interactive Stage Display */}
      <div className="glass-card p-8 border-t-4 border-t-idbi-cyan grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3.5">
              <div className={`p-3.5 rounded-2xl border ${current.accentColor}`}>
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-idbi-cyan uppercase tracking-wider">{current.phase}</span>
                <h3 className="text-2xl font-extrabold text-white mt-0.5">{current.title}</h3>
              </div>
            </div>
            <span className={current.badgeColor}>{current.badge}</span>
          </div>

          <p className="text-sm leading-relaxed text-slate-300 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80">
            {current.description}
          </p>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Borrower Case: <strong className="text-white">Radha Krishna Textiles (MSME-2026-NTC-91)</strong></span>
            <span>Udyam Reg: <strong className="text-mono text-slate-200">UDYAM-MH-19-0044812</strong></span>
          </div>
        </div>

        {/* Stage Key Metrics Box */}
        <div className="bg-slate-950/90 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-idbi-cyan" /> Stage Underwriting Metrics
            </h4>
            <div className="space-y-3.5">
              {Object.entries(current.metrics).map(([key, val], i) => (
                <div key={i} className="flex flex-col space-y-1 p-3 rounded-xl bg-slate-900/80 border border-slate-800/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-400">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-center">
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="w-full py-3 bg-gradient-to-r from-idbi-blue to-idbi-cyan hover:from-idbi-blue/90 hover:to-idbi-cyan/90 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Simulate Next Stage <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> OCEN Loan Sanction Letter Generated
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
