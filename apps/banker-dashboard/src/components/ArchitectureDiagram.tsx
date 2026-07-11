import React, { useState } from 'react';
import { ShieldCheck, Database, Cpu, Layers, ArrowRight, CheckCircle2, Lock, Server } from 'lucide-react';

interface ArchitectureDiagramProps {
  isLiveApi: boolean;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ isLiveApi }) => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const pipelineSteps = [
    {
      id: 1,
      title: 'Alternate Data Ingestion',
      subtitle: 'Multi-stream secure adapters',
      icon: Database,
      color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
      details: [
        'GSTN Returns (GSTR-3B & GSTR-1): Turnover, regularity & ITC matching',
        'NPCI UPI Summaries: Cash-flow velocity & customer diversity',
        'Account Aggregator (ReBIT AA v2.0): Formal banking footprint & OD buffer',
        'EPFO Payroll Records: Headcount stability & wage regularity',
        'Udyam Registry Verification: Business formalization & vintage'
      ],
      protocol: 'HTTPS / REST Webhooks with DEPA Consent Framework'
    },
    {
      id: 2,
      title: 'Apache Kafka Event Backbone',
      subtitle: 'KRaft Mode Decoupled Streams',
      icon: Layers,
      color: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
      details: [
        'Topic: raw-alt-data-events (Partitioned by MSME ID)',
        'Zero-loss asynchronous buffering during high-throughput webhook spikes',
        'DPDP Act 2023 compliance: Immediate purge upon consent revocation',
        'Near real-time re-scoring trigger on monthly GSTR-3B filing'
      ],
      protocol: 'Kafka 3.7.0 (No Zookeeper) • Exactly-Once Semantics'
    },
    {
      id: 3,
      title: 'Python FastAPI ML Scoring Engine',
      subtitle: 'XGBoost / LightGBM + TreeSHAP',
      icon: Cpu,
      color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
      details: [
        'Extracts 36 statistical features across 5 domain sub-scores',
        'Native NaN handling gracefully degrades for NTC Thin-File borrowers',
        'Platt/Brier Isotonic Calibration scales probabilities to 300-900 score',
        'TreeSHAP (SHapley Additive exPlanations) generates exact reason codes',
        'Population Stability Index (PSI) drift monitoring in Prometheus'
      ],
      protocol: 'Python 3.11 • Sub-second Redis Caching (TTL 1hr)'
    },
    {
      id: 4,
      title: 'Health Card & OCEN 4.0 Adapter',
      subtitle: 'Spring Boot 3.3 Core Service',
      icon: ShieldCheck,
      color: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
      details: [
        'Generates immutable cryptographic Health Card with SHA-256 audit hash',
        'Formats Loan Service Provider (LSP) payload for OCEN 4.0 protocol',
        'Integrates with Unified Lending Interface (ULI) for automated underwriting',
        'Near real-time credit decisioning: < 3s SLA from consent to offer'
      ],
      protocol: 'Java 21 LTS • PostgreSQL 16 (pgcrypto) ACID Store'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="glass-card p-6 border-l-4 border-l-idbi-cyan flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-idbi-cyan/20 text-idbi-cyan border border-idbi-cyan/30">
              Interactive System Topology
            </span>
            {isLiveApi ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Gateway Active
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Audit Cohort Mode
              </span>
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-2">
            Multi-Stream Architecture & OCEN 4.0 Interoperability
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Our platform bridges the ₹25–30 Lakh Crore MSME credit gap by replacing static collateral checks with real-time alternate data pipelines. Click any component below to inspect architectural specs and compliance layers.
          </p>
        </div>
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center shrink-0">
          <p className="text-[10px] uppercase font-semibold text-slate-400">P95 Pipeline SLA</p>
          <p className="text-xl font-black text-emerald-400 mt-0.5">2.48s</p>
          <p className="text-[10px] text-slate-500">End-to-End Latency</p>
        </div>
      </div>

      {/* Interactive Architecture Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {pipelineSteps.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = activeStep === step.id;
          return (
            <div
              key={step.id}
              onClick={() => setActiveStep(isSelected ? null : step.id)}
              className={`glass-card p-6 border-2 cursor-pointer transition-all duration-300 relative ${
                isSelected ? step.color + ' shadow-2xl scale-[1.02]' : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl border ${step.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  Step 0{step.id}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mt-4">{step.title}</h3>
              <p className="text-xs font-medium text-slate-400 mt-1">{step.subtitle}</p>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-idbi-cyan font-semibold">Click to inspect</span>
                <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90 text-white' : 'text-slate-500'}`} />
              </div>

              {idx < 3 && (
                <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  <ArrowRight className="w-6 h-6" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded Step Details Panel */}
      {activeStep !== null && (
        <div className="glass-card p-8 border-t-4 border-t-idbi-cyan animate-fadeIn">
          {(() => {
            const step = pipelineSteps.find(s => s.id === activeStep)!;
            const Icon = step.icon;
            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl border ${step.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{step.title} Detailed Specifications</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{step.protocol}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveStep(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Close Specs
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Core Engineering Features
                    </h4>
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-idbi-cyan mt-1.5 shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-4 h-4 text-idbi-cyan" /> Regulatory & Compliance Guarantees
                    </h4>
                    <div className="space-y-3 text-xs text-slate-400">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
                        <strong className="text-slate-200 block mb-1">ReBIT AA v2.0 & DEPA Compliance</strong>
                        Cryptographically signed consent artifact with explicit purpose code (`CREDIT_ASSESSMENT`) and automated data expiry.
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
                        <strong className="text-slate-200 block mb-1">Zero Hardcoding Guarantee</strong>
                        Every score calculation is deterministic and reproducible from input features. No arbitrary bump-ups or fake cohort entries.
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
                        <strong className="text-slate-200 block mb-1">OCEN 4.0 & ULI Interoperability</strong>
                        Publishes standardized eligibility tokens (`loanEligibilityAmount`, `interestRateRebate`) directly into bank underwriting core.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tech Stack Matrix Card */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-idbi-cyan" /> Enterprise Microservice Stack
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Gateway & Core</p>
            <p className="text-sm font-bold text-white mt-1">Spring Boot 3.3</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">Java 21 LTS</p>
          </div>
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">AI / ML Engine</p>
            <p className="text-sm font-bold text-white mt-1">FastAPI 0.115</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">Python 3.11</p>
          </div>
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Model Architecture</p>
            <p className="text-sm font-bold text-white mt-1">XGBoost 2.1</p>
            <p className="text-[10px] text-idbi-cyan mt-0.5">+ TreeSHAP XAI</p>
          </div>
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Event Backbone</p>
            <p className="text-sm font-bold text-white mt-1">Apache Kafka 3.7</p>
            <p className="text-[10px] text-purple-400 mt-0.5">KRaft Mode</p>
          </div>
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Primary Database</p>
            <p className="text-sm font-bold text-white mt-1">PostgreSQL 16</p>
            <p className="text-[10px] text-amber-400 mt-0.5">pgcrypto ACID</p>
          </div>
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Real-Time Cache</p>
            <p className="text-sm font-bold text-white mt-1">Redis 7-alpine</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">Sub-second TTL</p>
          </div>
        </div>
      </div>
    </div>
  );
};
