'use client'

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/app/components/Sidebar';
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
import APIKeyManagement from './APIKeyManagement';
import ChangePassword from './ChangePassword';
import BackupManagement from './BackupManagement';
import AutomationManagement from './AutomationManagement';
import MandatoryChangePasswordModal from './MandatoryChangePasswordModal';
import Notification from './Notification';
import MeetingConnections from './MeetingConnections';
import MasterCalendar from './MasterCalendar';

import { Lead, Property } from '../types';
import { API_BASE } from '../config';
import { useTranslations } from 'next-intl';

interface DashboardClientProps {
  initialLeads: Lead[];
  initialProperties: Property[];
  token: string;
  role: string;
}

export default function DashboardClient({ initialLeads, initialProperties, token, role }: DashboardClientProps) {
  const t = useTranslations('Dashboard');
  const ts = useTranslations('Settings');
  const tc = useTranslations('Sidebar');

  const [activeTab, setActiveTab] = useState('Leads');
  const [leads, setLeads] = useState(initialLeads || []);
  const [properties, setProperties] = useState(initialProperties || []);
  const [analytics, setAnalytics] = useState({ total_leads: 0, active_properties: 0, total_revenue: 0 });
  const [permissions, setPermissions] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [leadsFilters, setLeadsFilters] = useState<any>({});
  const [customFieldDefs, setCustomFieldDefs] = useState<any[]>([]);

  const notify = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (selectedLead) {
      const updated = leads.find(l => l.id === selectedLead.id);
      if (updated) setSelectedLead(updated);
    }
  }, [leads]);

  useEffect(() => {
    if (selectedProperty) {
      const updated = properties.find(p => p.id === selectedProperty.id);
      if (updated) setSelectedProperty(updated);
    }
  }, [properties]);

  useEffect(() => {
    const shouldChange = document.cookie.includes('crm_must_change=true');
    if (shouldChange) {
      setMustChangePassword(true);
    }

    fetchUsers();
    fetchCustomFields();
  }, []);

  const fetchCustomFields = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/custom-fields?entity_type=lead`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setCustomFieldDefs(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch users", e);
    }
  };

  const refreshData = async (newFilters?: any) => {
    try {
      const activeFilters = newFilters !== undefined ? newFilters : leadsFilters;
      const headers = { Authorization: `Bearer ${token}` };

      const leadQuery = new URLSearchParams();
      Object.entries(activeFilters).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach(item => {
            if (item) leadQuery.append(k, String(item));
          });
        } else if (v !== undefined && v !== null && v !== '') {
          leadQuery.append(k, String(v));
        }
      });

      const leadUrl = `${API_BASE}/api/v1/leads${leadQuery.toString() ? '?' + leadQuery.toString() : ''}`;

      const [resLeads, resProps, resAnalytics] = await Promise.all([
        fetch(leadUrl, { headers }),
        fetch(`${API_BASE}/api/v1/properties`, { headers }),
        fetch(`${API_BASE}/api/v1/analytics`, { headers }),
      ]);

      if (resLeads.status === 401 || resProps.status === 401 || resAnalytics.status === 401) {
        window.location.reload();
        return;
      }

      if (resLeads.ok) setLeads(await resLeads.json());
      if (resProps.ok) setProperties(await resProps.json());
      if (resAnalytics.ok) setAnalytics(await resAnalytics.json());

      if (role === 'admin') {
        const resPerms = await fetch(`${API_BASE}/api/v1/roles`, { headers });
        if (resPerms.ok) {
          setPermissions(await resPerms.json());
        }
      }

      setRefreshTrigger(p => p + 1);
    } catch (e) {
      console.error(e);
      if (e instanceof Error && e.message.includes('401')) {
        window.location.reload();
      }
    }
  };

  const onFilterChange = (newFilters: any) => {
    setLeadsFilters(newFilters);
    refreshData(newFilters);
  };

  const handleAdd = () => {
    if (activeTab === 'Leads') setShowAddLead(true);
    if (activeTab === 'Properties') setShowAddProperty(true);
    if (activeTab === 'Deals') setShowAddDeal(true);
  };

  const handleLocaleChange = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  const currentLocale = typeof document !== 'undefined' ? (document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1] || 'en') : 'en';

  const openLeadById = async (id: number) => {
    const lead = leads.find(l => l.id === id);
    if (lead) {
      setSelectedLead(lead);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const allLeads: Lead[] = await res.json();
        setLeads(allLeads);
        const fetched = allLeads.find(l => l.id === id);
        if (fetched) {
          setSelectedLead(fetched);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    notify("Lead not found or no permission to view", "error");
  };

  const canAdd = ['Leads', 'Properties', 'Deals'].includes(activeTab);

  const totalLeads = analytics.total_leads || leads.length;
  const activeLeads = leads.filter(l => l.status === 'Active').length;
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;
  const newLeads = leads.filter(l => l.status === 'New').length;

  const closeNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <div className="flex h-screen w-full bg-n-800 overflow-hidden">
      <Sidebar role={role} activeTab={activeTab} setActiveTab={setActiveTab} permissions={permissions} />

      <div className="flex-1 ml-[220px] flex flex-col h-screen overflow-hidden">
        <header className="shrink-0 h-14 border-b border-n-500/60 bg-n-900/80 backdrop-blur-md px-6 flex items-center justify-between gap-4 z-40">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-n-50">{tc(activeTab === 'API' ? 'api' : activeTab.toLowerCase())}</h1>
            <span className="text-n-500">·</span>
            <span className="text-xs text-n-300 font-medium capitalize">{role} workspace</span>
          </div>
          <div className="flex items-center gap-2">
            {canAdd && (
              <button onClick={handleAdd} className="btn-primary gap-2 text-xs py-1.5 px-3 h-8">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                {activeTab === 'Leads' ? t('new_lead') : activeTab === 'Properties' ? t('new_property') : t('new_deal')}
              </button>
            )}
            <button onClick={() => refreshData()} className="btn-ghost h-8 px-2" title={t('refresh')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'Leads' && (
            <div className="space-y-5 animate-slide-up">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: t('total_leads'), value: totalLeads, color: 'text-accent-400', bg: 'bg-accent-500/10', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                  { label: t('active'), value: activeLeads, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { label: t('qualified'), value: qualifiedLeads, color: 'text-violet-400', bg: 'bg-violet-500/10', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
                  { label: t('new_period'), value: newLeads, color: 'text-sky-400', bg: 'bg-sky-500/10', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                ].map(s => (
                  <div key={s.label} className="card p-4 group hover:border-n-400 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="section-title">{s.label}</span>
                      <span className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                        <svg className={`w-3.5 h-3.5 ${s.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                        </svg>
                      </span>
                    </div>
                    <p className={`text-3xl font-black tracking-tight ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="card relative z-30">
                <LeadsTable
                  leads={leads}
                  token={token}
                  role={role}
                  users={users}
                  customFieldDefs={customFieldDefs}
                  refreshData={() => refreshData()}
                  onLeadClick={setSelectedLead}
                  onFilterChange={onFilterChange}
                  notify={notify}
                />
              </div>
            </div>
          )}

          {activeTab === 'Properties' && (
            <div className="space-y-5 animate-slide-up">
              <PropertiesGrid properties={properties} onPropertyClick={setSelectedProperty} />
            </div>
          )}

          {activeTab === 'Deals' && <div className="animate-slide-up"><DealsPipeline token={token} key={refreshTrigger} /></div>}
          {activeTab === 'Insights' && <div className="animate-slide-up"><AnalyticsDashboard token={token} /></div>}
          {activeTab === 'Calendar' && (
            <div className="animate-slide-up h-[calc(100vh-140px)]">
              <MasterCalendar token={token} onLeadClick={openLeadById} />
            </div>
          )}
          {activeTab === 'Fields' && role === 'admin' && <FieldManagement token={token} />}
          {activeTab === 'Team' && (role === 'admin' || permissions.some(p => p.resource === 'users' && p.can_view)) && <UserManagement token={token} />}
          {activeTab === 'Roles' && role === 'admin' && <RoleManagement token={token} />}
          {activeTab === 'API' && role === 'admin' && <APIKeyManagement token={token} />}
          {activeTab === 'Backups' && role === 'admin' && <BackupManagement token={token} notify={notify} />}
          {activeTab === 'Automation' && role === 'admin' && <AutomationManagement token={token} />}
          {activeTab === 'Settings' && (
            <div className="space-y-8 animate-slide-up">
              {/* Language Switcher */}
              <div className="card p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-n-50 mb-1">{ts('language')}</h3>
                  <p className="text-xs text-n-400">{ts('language_description')}</p>
                </div>
                <div className="flex gap-4">
                  {[
                    { id: 'en', label: ts('english'), flag: '🇺🇸' },
                    { id: 'ru', label: ts('russian'), flag: '🇷🇺' }
                  ].map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => handleLocaleChange(lang.id)}
                      className={`flex-1 flex items-center justify-between p-4 rounded-xl border transition-all ${currentLocale === lang.id
                        ? 'bg-accent-500/10 border-accent-500/40 ring-1 ring-accent-500/20'
                        : 'bg-n-800 border-n-500/40 hover:border-n-400'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{lang.flag}</span>
                        <span className={`text-sm font-bold ${currentLocale === lang.id ? 'text-accent-400' : 'text-n-100'}`}>
                          {lang.label}
                        </span>
                      </div>
                      {currentLocale === lang.id && (
                        <div className="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <ChangePassword token={token} />
              <MeetingConnections token={token} notify={notify} />
            </div>
          )}
        </main>
      </div>

      {showAddLead && <AddLeadModal token={token} onClose={() => setShowAddLead(false)} onSuccess={() => { refreshData(); setShowAddLead(false); notify("Lead added successfully!"); }} />}
      {showAddProperty && <AddPropertyModal token={token} onClose={() => setShowAddProperty(false)} onSuccess={() => { refreshData(); setShowAddProperty(false); notify("Property listed successfully!"); }} />}
      {showAddDeal && <AddDealModal token={token} leads={leads} properties={properties} onClose={() => setShowAddDeal(false)} onSuccess={() => { refreshData(); setShowAddDeal(false); notify("Deal created successfully!"); }} />}
      {selectedLead && <LeadDetailsModal lead={selectedLead} token={token} onClose={() => setSelectedLead(null)} onUpdate={refreshData} notify={notify} />}
      {selectedProperty && <PropertyDetailsModal property={selectedProperty} token={token} onClose={() => setSelectedProperty(null)} onUpdate={refreshData} notify={notify} />}

      {mustChangePassword && (
        <MandatoryChangePasswordModal
          token={token}
          onSuccess={() => setMustChangePassword(false)}
        />
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
    </div>
  );
}
