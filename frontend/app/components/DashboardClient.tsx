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
import UserManagement from './UserManagement';
import AddPropertyModal from './AddPropertyModal';
import AddDealModal from './AddDealModal';
import FieldManagement from './FieldManagement';
import RoleManagement from './RoleManagement';

import { Lead, Property } from '../types';

interface DashboardClientProps {
  initialLeads: Lead[];
  initialProperties: Property[];
  token: string;
  role: string;
}

export default function DashboardClient({ initialLeads, initialProperties, token, role }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState('Leads');
  const [leads, setLeads] = useState(initialLeads || []);
  const [properties, setProperties] = useState(initialProperties || []);
  const [analytics, setAnalytics] = useState({ total_leads: 0, active_properties: 0, total_revenue: 0, lead_status_counts: {}, deal_status_counts: {} });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const refreshData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resLeads, resProps, resAnalytics] = await Promise.all([
        fetch('http://localhost:8080/api/v1/leads', { headers }),
        fetch('http://localhost:8080/api/v1/properties', { headers }),
        fetch('http://localhost:8080/api/v1/analytics', { headers })
      ]);

      if (resLeads.ok) setLeads(await resLeads.json());
      if (resProps.ok) setProperties(await resProps.json());
      if (resAnalytics.ok) setAnalytics(await resAnalytics.json());

      setRefreshTrigger(prev => prev + 1);
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
          <button 
            className="btn-primary flex items-center gap-2" 
            onClick={() => {
              if (activeTab === 'Leads') setShowAddLead(true);
              else if (activeTab === 'Properties') setShowAddProperty(true);
              else if (activeTab === 'Deals') setShowAddDeal(true);
              else if (activeTab === 'Fields') setShowAddLead(true); // Placeholder for add field
              else if (activeTab === 'Team') setShowAddLead(true); // Placeholder for add user
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {activeTab === 'Leads' && 'New Lead'}
            {activeTab === 'Properties' && 'Add Property'}
            {activeTab === 'Deals' && 'Open Deal'}
            {activeTab === 'Insights' && 'Refresh Stats'}
            {activeTab === 'Fields' && 'New Field'}
            {activeTab === 'Team' && 'New User'}
          </button>
        </header>

        <div className="p-8 pb-20 flex-1 w-full max-w-7xl mx-auto flex flex-col gap-8">
          <StatCards 
            totalLeads={analytics.total_leads || leads.length} 
            availableProperties={analytics.active_properties || properties.filter(p => p.status === 'Available').length} 
            closedRevenue={analytics.total_revenue || 0} 
          />
          
          <div className="flex items-center gap-8 border-b border-dark-border">
            <button 
              onClick={() => setActiveTab('Leads')}
              className={`pb-4 text-sm font-semibold transition-all ${activeTab === 'Leads' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
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
            {role === 'admin' && (
              <>
                <button 
                  onClick={() => setActiveTab('Fields')}
                  className={`pb-4 text-sm font-semibold transition-all ${activeTab === 'Fields' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Fields
                </button>
                <button 
                  onClick={() => setActiveTab('Team')}
                  className={`pb-4 text-sm font-semibold transition-all ${activeTab === 'Team' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Team
                </button>
                <button 
                  onClick={() => setActiveTab('Roles')}
                  className={`pb-4 text-sm font-semibold transition-all ${activeTab === 'Roles' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Roles
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {activeTab === 'Leads' ? (
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
                <DealsPipeline token={token} key={refreshTrigger} />
              </>
            ) : activeTab === 'Insights' ? (
              <>
                <h2 className="text-xl font-medium tracking-tight">Business Intelligence</h2>
                <AnalyticsDashboard token={token} />
              </>
            ) : activeTab === 'Fields' && role === 'admin' ? (
              <>
                <FieldManagement token={token} />
              </>
            ) : activeTab === 'Team' && role === 'admin' ? (
              <>
                <UserManagement token={token} />
              </>
            ) : activeTab === 'Roles' && role === 'admin' ? (
              <>
                <RoleManagement token={token} />
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

      {showAddProperty && (
        <AddPropertyModal 
          token={token} 
          onClose={() => setShowAddProperty(false)} 
          onSuccess={() => {
            setShowAddProperty(false);
            refreshData();
          }} 
        />
      )}

      {showAddDeal && (
        <AddDealModal 
          token={token} 
          leads={leads}
          properties={properties}
          onClose={() => setShowAddDeal(false)} 
          onSuccess={() => {
            setShowAddDeal(false);
            refreshData();
          }} 
        />
      )}

      {selectedLead && (
        <LeadDetailsModal 
          lead={selectedLead} 
          token={token} 
          onClose={() => setSelectedLead(null)} 
          onUpdate={refreshData}
        />
      )}

      {selectedProperty && (
        <PropertyDetailsModal 
          property={selectedProperty} 
          token={token}
          onClose={() => setSelectedProperty(null)} 
          onUpdate={refreshData}
        />
      )}
    </div>
  );
}
