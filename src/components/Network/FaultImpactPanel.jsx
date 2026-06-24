import React, { useMemo } from 'react';
import { X, Shield, Zap, Thermometer, AlertTriangle, CheckCircle, Battery, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateSiteHealth, getSiteRiskLevel, analyzePowerChain, estimateBackupDuration, generateRecommendations, calculateCoolingScore, calculateRedundancyScore, RISK_COLORS } from '../../utils/networkScoring';

export default function FaultImpactPanel({ site, topologyLinks, onClose }) {
  const analysis = useMemo(() => {
    const health = calculateSiteHealth(site.devices);
    const risk = getSiteRiskLevel(health, site.devices);
    const powerChain = analyzePowerChain(site.devices);
    const backupDuration = estimateBackupDuration(site.devices);
    const coolingScore = Math.round(calculateCoolingScore(site.devices) * 100);
    const redundancyScore = Math.round(calculateRedundancyScore(site.devices) * 100);
    const recommendations = generateRecommendations(site.devices, health);

    // Downstream impact — sites connected downstream via topology
    const downstreamSites = topologyLinks
      .filter(link => link.source.name === site.name)
      .map(link => link.target.name);

    return { health, risk, powerChain, backupDuration, coolingScore, redundancyScore, recommendations, downstreamSites };
  }, [site, topologyLinks]);

  const riskStyle = RISK_COLORS[analysis.risk];

  const healthColor = analysis.health >= 85 ? 'text-emerald-500' :
                      analysis.health >= 70 ? 'text-blue-500' :
                      analysis.health >= 50 ? 'text-amber-500' : 'text-red-500';

  const healthBg = analysis.health >= 85 ? 'from-emerald-500' :
                   analysis.health >= 70 ? 'from-blue-500' :
                   analysis.health >= 50 ? 'from-amber-500' : 'from-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="absolute top-4 right-20 z-[1500] w-[340px] max-h-[calc(100vh-32px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className={`p-4 bg-gradient-to-r ${healthBg} to-slate-800 text-white`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-extrabold text-lg leading-tight">{site.name}</h3>
            <p className="text-white/70 text-xs mt-1 font-medium">{site.devices.length} perangkat terdaftar</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Health Score Gauge */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="5"
                strokeDasharray={`${(analysis.health / 100) * 175.9} 175.9`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold">{analysis.health}</span>
          </div>
          <div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${riskStyle.bg} ${riskStyle.text} border ${riskStyle.border}`}>
              {analysis.risk}
            </span>
            <p className="text-white/60 text-[10px] mt-1.5">Backup: {analysis.backupDuration}</p>
          </div>
        </div>
      </div>

      {/* Body - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Power Chain */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Power Chain
          </h4>
          <div className="space-y-1.5">
            {analysis.powerChain.map((comp, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  {comp.status === 'OK' && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                  {comp.status === 'DEGRADED' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                  {comp.status === 'DOWN' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                  {comp.status === 'MISSING' && <X className="w-3.5 h-3.5 text-slate-400" />}
                  <span className={`text-xs font-bold ${comp.status === 'MISSING' ? 'text-slate-400' : 'text-slate-700 dark:text-white'}`}>{comp.name}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  comp.status === 'OK' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                  comp.status === 'DEGRADED' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                  comp.status === 'DOWN' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                  'bg-slate-100 dark:bg-slate-700 text-slate-400'
                }`}>
                  {comp.status === 'MISSING' ? 'Tidak Ada' : `${comp.operational}/${comp.count}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cooling & Redundancy */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
            <Thermometer className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-extrabold text-slate-800 dark:text-white">{analysis.coolingScore}%</p>
            <p className="text-[10px] text-slate-400 font-medium">Cooling</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
            <Battery className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
            <p className="text-lg font-extrabold text-slate-800 dark:text-white">{analysis.redundancyScore}%</p>
            <p className="text-[10px] text-slate-400 font-medium">Redundansi</p>
          </div>
        </div>

        {/* Downstream Impact */}
        {analysis.downstreamSites.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> Downstream Impact
            </h4>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-700 dark:text-red-400 font-bold mb-1">
                {analysis.downstreamSites.length} site terdampak jika site ini down:
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {analysis.downstreamSites.map((name, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Rekomendasi
            </h4>
            <div className="space-y-1.5">
              {analysis.recommendations.slice(0, 5).map((rec, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-sm mt-0.5">{rec.icon}</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{rec.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
