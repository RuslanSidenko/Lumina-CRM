'use client'

import { useState, useEffect } from 'react';
import { Deal } from '../types';
import { API_BASE } from '../config';
import { useTranslations } from 'next-intl';

interface DealsPipelineProps {
  token: string;
}

const STAGES = ['Offer', 'Under Contract', 'Escrow', 'Closed', 'Lost'] as const;

export default function DealsPipeline({ token }: DealsPipelineProps) {
  const t = useTranslations('Deals');
  const tc = useTranslations('Common');
  
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/v1/deals`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setDeals(await res.json());
    setLoading(false);
  };

  const updateStatus = async (dealId: number, newStatus: string) => {
    const res = await fetch(`${API_BASE}/api/v1/deals/${dealId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) fetchDeals();
  };

  if (loading) return <div className="p-12 text-center text-n-400">{tc('loading')}</div>;

  return (
    <div className="flex gap-6 overflow-x-auto pb-8 min-h-[600px]">
      {STAGES.map(stage => (
        <div key={stage} className="flex-1 min-w-[280px] flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-n-400 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${stage === 'Closed' ? 'bg-green-500' :
                  stage === 'Lost' ? 'bg-red-500' :
                    stage === 'Offer' ? 'bg-blue-500' : 'bg-yellow-500'
                }`} />
              {stage}
            </h3>
            <span className="text-[10px] font-bold bg-n-900 px-1.5 py-0.5 rounded text-n-400 border border-n-500/20">
              {deals.filter(d => d.status === stage).length}
            </span>
          </div>

          <div className="flex-1 bg-n-900/30 rounded-xl border border-n-500/50 p-3 flex flex-col gap-3 min-h-[400px]">
            {deals.filter(d => d.status === stage).map(deal => (
              <div
                key={deal.id}
                className="card p-4 hover:border-accent-500/50 transition-all cursor-grab active:cursor-grabbing group"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('dealId', deal.id.toString())}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-n-500 uppercase tracking-tighter">#DEAL-{deal.id}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {STAGES.filter(s => s !== stage).slice(0, 2).map(nextStage => (
                      <button
                        key={nextStage}
                        onClick={() => updateStatus(deal.id, nextStage)}
                        className="text-[9px] bg-white/5 hover:bg-white/10 px-1 py-0.5 rounded border border-white/10 text-n-300"
                      >
                        → {nextStage}
                      </button>
                    ))}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-n-50 mb-1">Property #{deal.property_id}</h4>
                <p className="text-xs text-n-400 mb-3 truncate">Lead #{deal.lead_id}</p>
                <div className="text-lg font-black text-accent-400 leading-tight">
                  ${deal.price.toLocaleString()}
                </div>
              </div>
            ))}

            <div
              className="flex-1 border-2 border-dashed border-transparent rounded-lg"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dealId = e.dataTransfer.getData('dealId');
                if (dealId) updateStatus(parseInt(dealId), stage);
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
