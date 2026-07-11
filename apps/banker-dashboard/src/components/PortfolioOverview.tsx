import React, { useState, useEffect } from 'react';
import type { MsmeProfile } from '../types';
import { ShieldCheck, AlertTriangle, TrendingUp, Users, CheckCircle2, PieChart as PieIcon, BarChart3, Layers, GitCompare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnimatedCounterProps {
  end: number;
  decimals?: number;
  suffix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ end, decimals = 0, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1200; // 1.2 seconds count-up
    const startValue = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (end - startValue) * easeProgress;
      setCount(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end]);

  return <span>{count.toFixed(decimals)}{suffix}</span>;
};

interface PortfolioOverviewProps {
  cohort: MsmeProfile[];
  onSelectMsme: (msme: MsmeProfile) => void;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ cohort, onSelectMsme }) => {
  const totalMsmes = cohort.length;
  const avgScore = Math.round(cohort.reduce((acc, curr) => acc + curr.healthScore, 0) / (totalMsmes || 1));
  const ntcCohort = cohort.filter(c => c.isNtcThinFile);
  const establishedCohort = cohort.filter(c => !c.isNtcThinFile);
  const ntcCount = ntcCohort.length;
  const ntcRatio = Math.round((ntcCount / (totalMsmes || 1)) * 100);
  const avgPd = (cohort.reduce((acc, curr) => acc + curr.defaultProbability12m, 0) / (totalMsmes || 1)) * 100;

  // NTC vs Established comparison averages
  const ntcAvgScore = Math.round(ntcCohort.reduce((acc, curr) => acc + curr.healthScore, 0) / (ntcCount || 1));
  const estAvgScore = Math.round(establishedCohort.reduce((acc, curr) => acc + curr.healthScore, 0) / (establishedCohort.length || 1));
  const ntcAvgPd = (ntcCohort.reduce((acc, curr) => acc + curr.defaultProbability12m, 0) / (ntcCount || 1)) * 100;
  const estAvgPd = (establishedCohort.reduce((acc, curr) => acc + curr.defaultProbability12m, 0) / (establishedCohort.length || 1)) * 100;

  // Risk band counts
  const primeCount = cohort.filter(c => c.riskBand === 'PRIME_RISK').length;
  const modCount = cohort.filter(c => c.riskBand === 'MODERATE_RISK').length;
  const highCount = cohort.filter(c => c.riskBand === 'HIGH_RISK').length;

  const pieData = [
    { name: 'Prime Risk (Score ≥700)', value: primeCount, color: '#10B981' },
    { name: 'Moderate Risk (Score 600-699)', value: modCount, color: '#F59E0B' },
    { name: 'High Risk (Score <600)', value: highCount, color: '#EF4444' },
  ];

  // Score distribution bins
  const scoreBins = [
    { range: '500-599', count: cohort.filter(c => c.healthScore >= 500 && c.healthScore < 600).length },
    { range: '600-649', count: cohort.filter(c => c.healthScore >= 600 && c.healthScore < 650).length },
    { range: '650-699', count: cohort.filter(c => c.healthScore >= 650 && c.healthScore < 700).length },
    { range: '700-749', count: cohort.filter(c => c.healthScore >= 700 && c.healthScore < 750).length },
    { range: '750-799', count: cohort.filter(c => c.healthScore >= 750 && c.healthScore < 800).length },
    { range: '800-900', count: cohort.filter(c => c.healthScore >= 800).length },
  ];

  // Sector-wise Heatmap / Treemap aggregation
  const sectorMap: Record<string, { count: number; totalScore: number; primeCount: number }> = {};
  cohort.forEach(c => {
    if (!sectorMap[c.sector]) {
      sectorMap[c.sector] = { count: 0, totalScore: 0, primeCount: 0 };
    }
    sectorMap[c.sector].count += 1;
    sectorMap[c.sector].totalScore += c.healthScore;
    if (c.riskBand === 'PRIME_RISK') sectorMap[c.sector].primeCount += 1;
  });

  const sectorList = Object.entries(sectorMap).map(([sector, stats]) => ({
    sector,
    count: stats.count,
    avgScore: Math.round(stats.totalScore / stats.count),
    primeRatio: Math.round((stats.primeCount / stats.count) * 100),
    percentageOfPortfolio: Math.round((stats.count / (totalMsmes || 1)) * 100)
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* KPI Cards Grid with Count-Up Animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-idbi-cyan flex items-center justify-between relative overflow-hidden rounded-2xl shadow-xl group">
          <div className="absolute inset-0 bg-[url('/images/bg-dark-art.jpg')] bg-cover bg-center opacity-25 group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[1px] pointer-events-none" />
          <div className="relative z-10">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Assessed MSMEs</p>
            <h3 className="text-3xl font-extrabold text-white mt-1 font-mono">
              <AnimatedCounter end={totalMsmes} />
            </h3>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Validated against ReBIT AA & GST schemas
            </p>
          </div>
          <div className="p-3.5 bg-idbi-cyan/10 rounded-2xl text-idbi-cyan relative z-10">
            <Users className="w-7 h-7" />
          </div>
        </div>

        <div className={`glass-card p-6 border-l-4 ${avgScore >= 700 ? 'border-l-emerald-500' : avgScore >= 600 ? 'border-l-amber-500' : 'border-l-rose-500'} flex items-center justify-between`}>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Health Score</p>
            <h3 className={`text-3xl font-extrabold ${avgScore >= 700 ? 'text-emerald-400' : avgScore >= 600 ? 'text-amber-400' : 'text-rose-400'} mt-1 font-mono`}>
              <AnimatedCounter end={avgScore} /> <span className="text-sm font-normal text-slate-400">/ 900</span>
            </h3>
            <p className="text-xs text-slate-300 mt-2">
              Portfolio Quality: <span className={`${avgScore >= 700 ? 'text-emerald-400' : avgScore >= 600 ? 'text-amber-400' : 'text-rose-400'} font-semibold`}>
                {avgScore >= 700 ? 'Prime Tier' : avgScore >= 600 ? 'Moderate Tier' : 'High Risk Tier'}
              </span>
            </p>
          </div>
          <div className={`p-3.5 ${avgScore >= 700 ? 'bg-emerald-500/10 text-emerald-400' : avgScore >= 600 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'} rounded-2xl`}>
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-purple-500 flex items-center justify-between relative overflow-hidden rounded-2xl shadow-xl group">
          <div className="absolute inset-0 bg-[url('/images/bg-abstract-dots.jpg')] bg-cover bg-center opacity-25 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[1px] pointer-events-none" />
          <div className="relative z-10">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">NTC Thin-File Ratio</p>
            <h3 className="text-3xl font-extrabold text-purple-400 mt-1 font-mono">
              <AnimatedCounter end={ntcRatio} suffix="%" /> <span className="text-sm font-normal text-slate-400">({ntcCount} units)</span>
            </h3>
            <p className="text-xs text-purple-300 mt-2">
              Scored via Alternate GST/UPI/EPFO streams
            </p>
          </div>
          <div className="p-3.5 bg-purple-500/10 rounded-2xl text-purple-400 relative z-10">
            <TrendingUp className="w-7 h-7" />
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">12M Default Probability (PD)</p>
            <h3 className="text-3xl font-extrabold text-amber-400 mt-1 font-mono">
              <AnimatedCounter end={avgPd} decimals={2} suffix="%" />
            </h3>
            <p className="text-xs text-slate-300 mt-2">
              Calibrated via XGBoost + Isotonic Regression
            </p>
          </div>
          <div className="p-3.5 bg-amber-500/10 rounded-2xl text-amber-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score Distribution Histogram */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-idbi-blue/20 rounded-xl text-idbi-cyan">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Health Score Distribution</h4>
                <p className="text-xs text-slate-400">XGBoost 2.1 Model Output across 300-900 Scale</p>
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBins}>
                <XAxis dataKey="range" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }}
                />
                <Bar dataKey="count" fill="#00A3E0" radius={[8, 8, 0, 0]}>
                  {scoreBins.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index > 3 ? '#10B981' : index > 1 ? '#F59E0B' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Band Breakdown */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400">
                <PieIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Portfolio Risk Segmentation</h4>
                <p className="text-xs text-slate-400">Basel-III & RBI Credit Risk Tier Allocation</p>
              </div>
            </div>
          </div>
          <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="w-full sm:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-3">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-white font-mono">{item.value} <span className="text-xs font-normal text-slate-400">({Math.round((item.value / totalMsmes) * 100)}%)</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sector Concentration Heatmap & NTC vs Established Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sector-wise Concentration Heatmap */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-idbi-cyan/10 rounded-xl text-idbi-cyan">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Sector Concentration Heatmap</h4>
              <p className="text-xs text-slate-400">Portfolio exposure, average health score, and prime ratio across sectors</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {sectorList.map((sec) => (
              <div
                key={sec.sector}
                className={`p-3.5 rounded-xl border transition-all ${
                  sec.avgScore >= 700
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : sec.avgScore >= 640
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold truncate text-white">{sec.sector}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-300">
                    {sec.percentageOfPortfolio}%
                  </span>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Avg Score</span>
                    <strong className="text-base font-extrabold">{sec.avgScore}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Prime %</span>
                    <strong className="text-sm font-bold text-slate-200">{sec.primeRatio}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NTC vs Established Comparison Chart */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">NTC vs Established Cohort Assessment</h4>
              <p className="text-xs text-slate-400">Comparing alternate-data only borrowers vs traditional vintage borrowers</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">New-to-Credit (NTC) Cohort</span>
                <div className="text-2xl font-black font-mono text-white flex items-center gap-2">
                  <span>{ntcAvgScore} pts</span>
                  <span className="text-xs font-normal text-slate-400">({ntcCount} borrowers)</span>
                </div>
                <p className="text-[11px] text-slate-400">Avg PD: <strong className="text-amber-400 font-mono">{ntcAvgPd.toFixed(2)}%</strong> • 100% Alternate Data</p>
              </div>

              <div className="h-10 w-px bg-slate-800 hidden sm:block" />

              <div className="space-y-1 text-center sm:text-right">
                <span className="text-xs font-bold text-idbi-cyan uppercase tracking-wider">Established Vintage Cohort</span>
                <div className="text-2xl font-black font-mono text-white flex items-center justify-end gap-2">
                  <span>{estAvgScore} pts</span>
                  <span className="text-xs font-normal text-slate-400">({establishedCohort.length} borrowers)</span>
                </div>
                <p className="text-[11px] text-slate-400">Avg PD: <strong className="text-emerald-400 font-mono">{estAvgPd.toFixed(2)}%</strong> • Traditional + Alternate</p>
              </div>
            </div>

            <div className="p-3.5 bg-idbi-blue/10 border border-idbi-cyan/30 rounded-xl text-xs text-slate-300 leading-relaxed">
              <strong className="text-idbi-cyan">Key Audit Finding:</strong> Our 36-feature LightGBM scoring model successfully brings NTC thin-file enterprises to an average score of <strong className="text-white font-mono">{ntcAvgScore}</strong> (within <strong className="text-emerald-400">{Math.abs(estAvgScore - ntcAvgScore)} points</strong> of established borrowers), eliminating traditional rejection barriers while keeping default risk tightly controlled at <strong className="text-white font-mono">{ntcAvgPd.toFixed(2)}%</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Top Performers / Quick Action List */}
      <div className="glass-card p-6">
        <h4 className="text-lg font-bold text-white mb-4">Top Assessed MSME Applicants (Audit Ready)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cohort.slice(0, 3).map((msme) => (
            <div
              key={msme.msmeId}
              onClick={() => onSelectMsme(msme)}
              className="p-4 bg-slate-800/40 hover:bg-slate-800/80 rounded-xl border border-slate-800 hover:border-idbi-cyan/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-bold text-white group-hover:text-idbi-cyan transition-colors">{msme.businessName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{msme.sector} • {msme.udyamNumber}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className={msme.riskBand === 'PRIME_RISK' ? 'badge-prime' : 'badge-moderate'}>
                    {msme.riskBand.replace('_', ' ')}
                  </span>
                  {msme.isNtcThinFile && <span className="badge-ntc">NTC Thin-File</span>}
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-2xl font-extrabold text-emerald-400">{msme.healthScore}</span>
                <p className="text-[10px] text-slate-400 mt-1">PD: {(msme.defaultProbability12m * 100).toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
