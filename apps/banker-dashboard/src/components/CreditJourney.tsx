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
      accentColor: 'border-rose-300 bg-rose-50 text-rose-800'
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
      accentColor: 'border-idbi-blue/40 bg-[#001f35]/5 text-idbi-navy'
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
      accentColor: 'border-emerald-300 bg-emerald-50 text-emerald-800'
    },
    {
      id: 3,
      phase: 'Step 4: OCEN 4.0 Instant Disbursement',
      title: 'Automated ULI Underwriting & Sanction',
      badge: 'Status: LOAN SANCTIONED',
      badgeColor: 'badge-prime',
      description: 'The 742 Health Score cryptographic token is published via the OCEN 4.0 Loan Service Provider (LSP) adapter. The bank’s Unified Lending Interface (ULI) instantly sanctions a ₹18 Lakh working capital line at 10.85% p.a. (with a 1.25% digital health rebate)—all without physical branch visits or real estate collateral.',
      metrics: {
        sanctionLimit: '₹18,00,000 (Working Capital)',
        interestRate: '10.85% p.a. (-1.25% Rebate)',
        underwritingSLA: '< 3.2 Seconds End-to-End',
        collateralRequired: '0% (Unsecured Cash-Flow Backed)'
      },
      icon: Award,
      accentColor: 'border-purple-300 bg-purple-50 text-purple-800'
    }
  ];

  const current = journeySteps[currentStep];
  const Icon = current.icon;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="glass-card p-6 border-l-4 border-l-idbi-blue flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-idbi-blue/10 text-idbi-navy border border-idbi-blue/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Financial Inclusion Showcase
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-800 border border-purple-300">
              Zero Collateral Pipeline
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
            The NTC Thin-File to Prime Borrower Transformation
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Experience how our alternate data engine expands the bank's credit total addressable market (TAM) while keeping non-performing assets (NPA) under 1.5%. Walk through the real-time stages below.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 ${
              currentStep === 0 ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 shadow-sm'
            }`}
          >
            Previous Stage
          </button>
          <button
            onClick={() => setCurrentStep(Math.min(journeySteps.length - 1, currentStep + 1))}
            disabled={currentStep === journeySteps.length - 1}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-idbi-navy ${
              currentStep === journeySteps.length - 1
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800 cursor-not-allowed'
                : 'bg-idbi-navy text-white hover:bg-[#00385F] shadow-sm'
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
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-3.5 focus:outline-none focus:ring-2 focus:ring-idbi-navy ${
                isActive
                  ? 'bg-white border-idbi-blue shadow-md scale-[1.01]'
                  : isPassed
                  ? 'bg-slate-50 border-emerald-300 text-slate-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-lg border ${
                isActive ? step.accentColor : isPassed ? 'border-emerald-300 bg-emerald-100 text-emerald-800' : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}>
                {isPassed ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <StepIcon className="w-5 h-5" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Phase 0{idx + 1}</p>
                <p className={`text-xs font-bold truncate mt-0.5 ${isActive ? 'text-slate-900 font-extrabold' : isPassed ? 'text-slate-800' : 'text-slate-600'}`}>
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Interactive Stage Display */}
      <div className="glass-card p-8 border-t-4 border-t-idbi-blue grid grid-cols-1 lg:grid-cols-3 gap-8 shadow-sm">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3.5">
              <div className={`p-3.5 rounded-xl border ${current.accentColor}`}>
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-idbi-navy uppercase tracking-wider">{current.phase}</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{current.title}</h3>
              </div>
            </div>
            <span className={current.badgeColor}>{current.badge}</span>
          </div>

          <p className="text-sm leading-relaxed text-slate-800 bg-slate-50 p-5 rounded-xl border border-slate-200">
            {current.description}
          </p>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
            <span>Borrower Case: <strong className="text-slate-900">Radha Krishna Textiles (MSME-2026-NTC-91)</strong></span>
            <span>Udyam Reg: <strong className="text-slate-900 font-mono">UDYAM-MH-19-0044812</strong></span>
          </div>
        </div>

        {/* Stage Key Metrics Box */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-between space-y-6">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2.5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-idbi-navy" /> Stage Underwriting Metrics
            </h4>
            <div className="space-y-3.5">
              {Object.entries(current.metrics).map(([key, val], i) => (
                <div key={i} className="flex flex-col space-y-1 p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-800">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 text-center">
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="btn-primary"
              >
                Simulate Next Stage <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> OCEN Loan Sanction Letter Generated
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
