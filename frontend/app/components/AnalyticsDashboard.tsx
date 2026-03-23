'use client'
import { API_BASE } from '../config';

import { useState, useEffect } from 'react';

interface AnalyticsData {
   total_leads: number;
   active_properties: number;
   total_revenue: number;
   lead_status_counts: Record<string, number>;
   deal_status_counts: Record<string, number>;
}

export default function AnalyticsDashboard({ token }: { token: string }) {
   const [data, setData] = useState<AnalyticsData | null>(null);

   useEffect(() => {
      fetch(`${API_BASE}/api/v1/analytics`, {
         headers: { Authorization: `Bearer ${token}` }
      })
         .then(res => res.json())
         .then(setData);
   }, []);

   if (!data) return <div className="p-12 text-center text-slate-500">Calculating insights...</div>;

   return (
      <div className="flex flex-col gap-8">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatItem label="Total Leads" value={data.total_leads} color="text-brand-400" />
            <StatItem label="Active Listings" value={data.active_properties} color="text-blue-400" />
            <StatItem label="Deals Closed" value={data.deal_status_counts['Closed'] || 0} color="text-green-400" />
            <StatItem label="Closed Revenue" value={`$${(data.total_revenue / 1000).toFixed(1)}k`} color="text-emerald-400" />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-panel p-6 flex flex-col gap-6">
               <h3 className="text-lg font-bold">Lead Pipeline Status</h3>
               <div className="flex flex-col gap-4">
                  {Object.entries(data.lead_status_counts).map(([status, count]) => (
                     <div key={status} className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-semibold uppercase">
                           <span>{status}</span>
                           <span>{count}</span>
                        </div>
                        <div className="h-2 bg-dark-bg/50 rounded-full overflow-hidden">
                           <div
                              className="h-full bg-brand-500 transition-all duration-1000"
                              style={{ width: `${(count / data.total_leads) * 100}%` }}
                           />
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <div className="glass-panel p-6 flex flex-col gap-6">
               <h3 className="text-lg font-bold">Deal Stages</h3>
               <div className="flex flex-col gap-4">
                  {Object.entries(data.deal_status_counts).map(([status, count]) => (
                     <div key={status} className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-semibold uppercase">
                           <span>{status}</span>
                           <span>{count}</span>
                        </div>
                        <div className="h-2 bg-dark-bg/50 rounded-full overflow-hidden">
                           <div
                              className="h-full bg-blue-500 transition-all duration-1000"
                              style={{ width: `${(count / Object.values(data.deal_status_counts).reduce((a, b) => a + b, 0)) * 100}%` }}
                           />
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
}

function StatItem({ label, value, color }: { label: string, value: string | number, color: string }) {
   return (
      <div className="glass-panel p-6 flex flex-col gap-2 border-b-4 border-b-brand-500/30">
         <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
         <span className={`text-4xl font-black tracking-tighter ${color}`}>{value}</span>
      </div>
   );
}
