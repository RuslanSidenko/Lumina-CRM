'use client'

import { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import StatCards from '@/app/components/StatCards';
import LeadsTable from './LeadsTable';
import AddLeadModal from '@/app/components/AddLeadModal';
import LeadDetailsModal from './LeadDetailsModal';
import PropertiesGrid from './PropertiesGrid';
import PropertyDetailsModal from './PropertyDetailsModal';
import DealsPipeline from './DealsPipeline';
import AnalyticsDashboard from './AnalyticsDashboard';

import { Lead, Property } from '../types';

interface DashboardClientProps {
  initialLeads: Lead[];
  initialProperties: Property[];
  token: string;
  role: string;
}

export default function DashboardClient({ initialLeads, initialProperties, token, role }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [leads, setLeads] = useState(initialLeads || []);
  const [properties, setProperties] = useState(initialProperties || []);
  const [showAddLead, setShowAddLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const refreshData = async () => {
    try {
      const resLeads = await fetch('http://localhost:8080/api/v1/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resLeads.ok) setLeads(await resLeads.json());

      const resProps = await fetch('http://localhost:8080/api/v1/properties', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resProps.ok) setProperties(await resProps.json());
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen w-full bg-dark-bg overflow-hidden text-slate-200 font-sans">
      <Sidebar role={role} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col relative overflow-y-auto">
        <header className="sticky top-0 z-10 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border px-8 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-semibold tracking-tight">{activeTab}</h1>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddLead(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Lead
          </button>
        </header>

        <div className="p-8 pb-20 flex-1 w-full max-w-7xl mx-auto flex flex-col gap-8">
          <StatCards leads={leads} properties={properties} />
          
          <div className="flex items-center gap-8 border-b border-dark-border">
            <button 
              onClick={() => setActiveTab('Overview')}
              className={`pb-4 text-sm font-semibold transition-all ${activeTab === 'Overview' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Leads
            </button>
            <button 
              onClick={() => setActiveTab('Properties')}
              className={`pb-4 text-sm font-semibold transition-all ${activeTab === 'Properties' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Properties
            </button>
            <button 
              onClick={() => setActiveTab('Deals')}
              className={`pb-4 text-sm font-semibold transition-all ${activeTab === 'Deals' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Pipeline
            </button>
            <button 
              onClick={() => setActiveTab('Insights')}
              className={`pb-4 text-sm font-semibold transition-all ${activeTab === 'Insights' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Insights
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {activeTab === 'Overview' ? (
              <>
                <h2 className="text-xl font-medium tracking-tight">Leads Directory</h2>
                <LeadsTable 
                  leads={leads} 
                  token={token} 
                  role={role} 
                  refreshData={refreshData} 
                  onLeadClick={(lead) => setSelectedLead(lead)} 
                />
              </>
            ) : activeTab === 'Properties' ? (
              <>
                <h2 className="text-xl font-medium tracking-tight">Manage Listings</h2>
                <PropertiesGrid 
                  properties={properties} 
                  onPropertyClick={(p) => setSelectedProperty(p)} 
                />
              </>
            ) : activeTab === 'Deals' ? (
              <>
                <h2 className="text-xl font-medium tracking-tight">Sales Pipeline</h2>
                <DealsPipeline token={token} />
              </>
            ) : activeTab === 'Insights' ? (
              <>
                <h2 className="text-xl font-medium tracking-tight">Business Intelligence</h2>
                <AnalyticsDashboard token={token} />
              </>
            ) : (
              <div className="p-12 text-center text-slate-500">Feature coming soon.</div>
            )}
          </div>
        </div>
      </main>

      {showAddLead && (
        <AddLeadModal
          token={token}
          onClose={() => setShowAddLead(false)}
          onSuccess={() => {
            setShowAddLead(false);
            refreshData();
          }}
        />
      )}

      {selectedLead && (
        <LeadDetailsModal 
          lead={selectedLead} 
          token={token} 
          onClose={() => setSelectedLead(null)} 
        />
      )}

      {selectedProperty && (
        <PropertyDetailsModal 
          property={selectedProperty} 
          onClose={() => setSelectedProperty(null)} 
        />
      )}
    </div>
  );
}
