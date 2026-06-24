import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, X, Shield, AlertTriangle, Activity, Zap, MapPin, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { motion } from 'framer-motion';

import { useMapContext } from '../contexts/MapContext';
import { calculateSiteHealth, getSiteRiskLevel, inferSiteRole, RISK_COLORS } from '../utils/networkScoring';
import { getDistrictForLocation, DISTRICT_LIST } from '../utils/hierarchy';
import { isCatuDaya } from '../utils/parser';

export default function NetworkPage() {
  const mapData = useMapContext();
  const navigate = useNavigate();

  const locationsData = mapData.locationsData;
  const rawLocationsData = mapData.rawLocationsData;

  const siteHealthData = useMemo(() => {
    return rawLocationsData.map(loc => {
      const health = calculateSiteHealth(loc.devices);
      const risk = getSiteRiskLevel(health, loc.devices);
      const role = inferSiteRole(loc.devices);
      const district = getDistrictForLocation(loc.name);
      return { ...loc, health, risk, role, district };
    });
  }, [rawLocationsData]);

  const metrics = useMemo(() => {
    const totalSites = siteHealthData.length;
    const avgHealth = totalSites > 0 ? Math.round(siteHealthData.reduce((sum, s) => sum + s.health, 0) / totalSites) : 0;
    const criticalSites = siteHealthData.filter(s => s.risk === 'CRITICAL').length;
    const warningSites = siteHealthData.filter(s => s.risk === 'WARNING').length;
    const totalDevices = siteHealthData.reduce((sum, s) => sum + s.devices.length, 0);
    const idleDevices = siteHealthData.reduce((sum, s) => sum + s.devices.filter(d => d.STATUS !== 'OPERATIONAL').length, 0);
    const slaEstimate = totalDevices > 0 ? ((totalDevices - idleDevices) / totalDevices * 100).toFixed(1) : '0';

    return { totalSites, avgHealth, criticalSites, warningSites, totalDevices, idleDevices, slaEstimate };
  }, [siteHealthData]);

  const districtHealth = useMemo(() => {
    return DISTRICT_LIST.map(district => {
      const sites = siteHealthData.filter(s => s.district === district);
      const avgHealth = sites.length > 0 ? Math.round(sites.reduce((sum, s) => sum + s.health, 0) / sites.length) : 0;
      const criticalCount = sites.filter(s => s.risk === 'CRITICAL').length;
      return { name: district, health: avgHealth, sites: sites.length, critical: criticalCount };
    }).sort((a, b) => a.health - b.health);
  }, [siteHealthData]);

  const criticalSites = useMemo(() => {
    return [...siteHealthData]
      .sort((a, b) => a.health - b.health)
      .slice(0, 10);
  }, [siteHealthData]);

  const deviceDistribution = useMemo(() => {
    return DISTRICT_LIST.map(district => {
      const sites = siteHealthData.filter(s => s.district === district);
      let catuDaya = 0, nonCatu = 0;
      sites.forEach(s => s.devices.forEach(d => {
        if (isCatuDaya(d.DEVICE_TYPE)) catuDaya++;
        else nonCatu++;
      }));
      return { name: district, 'Catu Daya': catuDaya, 'Non-Catu Daya': nonCatu };
    });
  }, [siteHealthData]);

  const powerRadar = useMemo(() => {
    const components = ['GENSET', 'ATS', 'MDP', 'RECTIFIER', 'BATTERE', 'INVERTER'];
    return components.map(comp => {
      const totalSites = siteHealthData.length;
      const sitesWithComp = siteHealthData.filter(s =>
        s.devices.some(d => d.DEVICE_TYPE.toUpperCase().includes(comp))
      ).length;
      const coverage = totalSites > 0 ? Math.round((sitesWithComp / totalSites) * 100) : 0;
      return { component: comp, coverage };
    });
  }, [siteHealthData]);

  const healthColor = (health) => {
    if (health >= 85) return '#10b981';
    if (health >= 70) return '#3b82f6';
    if (health >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const handleNavigateToSite = (site) => {
    mapData.setActiveLocation(site.coords);
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 md:p-8 overflow-auto"
    >
      <div className="max-w-7xl mx-auto h-full flex flex-col relative pt-4">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Network className="w-6 h-6" />
              </div>
              Network Health Dashboard
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Analisis Kesehatan Infrastruktur — {metrics.totalSites} Site • {metrics.totalDevices} Perangkat
            </p>
          </div>
          <button onClick={() => navigate('/')} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center gap-2 font-medium">
            <ArrowLeft className="w-5 h-5 dark:text-slate-300" /> Kembali ke Peta
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 pb-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Skor Regional</span>
              </div>
              <p className="text-3xl font-extrabold" style={{ color: healthColor(metrics.avgHealth) }}>{metrics.avgHealth}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">dari 100</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Site Kritis</span>
              </div>
              <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">{metrics.criticalSites}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">+ {metrics.warningSites} warning</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Perangkat Idle</span>
              </div>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{metrics.idleDevices}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">dari {metrics.totalDevices}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">SLA Estimasi</span>
              </div>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{metrics.slaEstimate}%</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">target: 99.9%</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* District Health Bar Chart */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Skor Kesehatan per District</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtHealth} layout="vertical" margin={{ top: 0, right: 10, left: 5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={110} stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                      formatter={(value, name) => [`${value}${name === 'health' ? '/100' : ''}`, name === 'health' ? 'Skor' : name]}
                    />
                    <Bar dataKey="health" radius={[0, 6, 6, 0]} fill="#6366f1">
                      {districtHealth.map((entry, index) => (
                        <Cell key={index} fill={healthColor(entry.health)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Power Infrastructure Radar */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Cakupan Infrastruktur Power (%)</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={powerRadar}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="component" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="Coverage" dataKey="coverage" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Device Distribution */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Distribusi Perangkat per District</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deviceDistribution} margin={{ top: 0, right: 10, left: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                  <Bar dataKey="Catu Daya" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Non-Catu Daya" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Critical Sites Table */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Top 10 Site Perlu Perhatian</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase">Site</th>
                    <th className="text-left py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase">District</th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase">Role</th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase">Skor</th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase">Risk</th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase">Perangkat</th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {criticalSites.map((site, i) => {
                    const riskStyle = RISK_COLORS[site.risk];
                    const idle = site.devices.filter(d => d.STATUS !== 'OPERATIONAL').length;
                    return (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white">{site.name}</td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{site.district}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {site.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-extrabold" style={{ color: healthColor(site.health) }}>{site.health}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${riskStyle.bg} ${riskStyle.text} border ${riskStyle.border}`}>
                            {site.risk}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300">
                          {site.devices.length} <span className="text-slate-400">({idle} idle)</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleNavigateToSite(site)}
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                            title="Lihat di Peta"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
