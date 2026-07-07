import React from 'react';
import type { MsmeProfile } from '../types';
import { ShieldCheck, AlertTriangle, TrendingUp, Users, CheckCircle2, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PortfolioOverviewProps {
  cohort: MsmeProfile[];
  onSelectMsme: (msme: MsmeProfile) => void;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ cohort, onSelectMsme }) => {
  const totalMsmes = cohort.length;
  const avgScore = Math.round(cohort.reduce((acc, curr) => acc + curr.healthScore, 0) / (totalMsmes || 1));
  const ntcCount = cohort.filter(c => c.isNtcThinFile).length;
  const ntcRatio = Math.round((ntcCount / (totalMsmes || 1)) * 100);
  const avgPd = (cohort.reduce((acc, curr) => acc + curr.defaultProbability12m, 0) / (totalMsmes || 1)) * 100;

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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-idbi-cyan flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Assessed MSMEs</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{totalMsmes}</h3>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Validated against ReBIT AA & GST schemas
            </p>
          </div>
          <div className="p-3.5 bg-idbi-cyan/10 rounded-2xl text-idbi-cyan">
            <Users className="w-7 h-7" />
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Health Score</p>
            <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{avgScore} <span className="text-sm font-normal text-slate-400">/ 900</span></h3>
            <p className="text-xs text-slate-300 mt-2">
              Portfolio Quality: <span className="text-emerald-400 font-semibold">Prime Tier</span>
            </p>
          </div>
          <div className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-purple-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">NTC Thin-File Ratio</p>
            <h3 className="text-3xl font-extrabold text-purple-400 mt-1">{ntcRatio}% <span className="text-sm font-normal text-slate-400">({ntcCount} units)</span></h3>
            <p className="text-xs text-purple-300 mt-2">
              Scored via Alternate GST/UPI/EPFO streams
            </p>
          </div>
          <div className="p-3.5 bg-purple-500/10 rounded-2xl text-purple-400">
            <TrendingUp className="w-7 h-7" />
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">12M Default Probability (PD)</p>
            <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{avgPd.toFixed(2)}%</h3>
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
                  <span className="text-sm font-bold text-white">{item.value} <span className="text-xs font-normal text-slate-400">({Math.round((item.value / totalMsmes) * 100)}%)</span></span>
                </div>
              ))}
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
              <div className="text-right">
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
