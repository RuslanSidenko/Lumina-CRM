"use client";

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
}

interface Property {
  id: number;
  title: string;
  price: number;
  status: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string | null>(null);

  // Modal flags
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', status: 'New' });

  useEffect(() => {
    const stored = localStorage.getItem('crm_token');
    const storedRole = localStorage.getItem('crm_role');
    if (stored) {
      setToken(stored);
      setRole(storedRole);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const resLeads = await fetch('http://localhost:8080/api/v1/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resLeads.ok) {
        setLeads(await resLeads.json());
      } else {
        setToken(null);
        localStorage.removeItem('crm_token');
      }

      const resProps = await fetch('http://localhost:8080/api/v1/properties', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resProps.ok) setProperties(await resProps.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:8080/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      setRole(data.user.role);
      localStorage.setItem('crm_token', data.token);
      localStorage.setItem('crm_role', data.user.role);
    } else {
      alert("Login failed: " + data.error);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_role');
  };

  const submitNewLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:8080/api/v1/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...newLead, assigned_to: 2 })
    });
    if (res.ok) {
      setShowAddLead(false);
      setNewLead({ name: '', phone: '', email: '', status: 'New' });
      fetchData();
    } else {
      alert("Failed to add lead.");
    }
  };

  const deleteLead = async (id: number) => {
    if (!confirm("Delete lead? This requires Admin role.")) return;
    const res = await fetch(`http://localhost:8080/api/v1/leads/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchData();
    } else {
      alert("Failed to delete lead. You must be an admin.");
    }
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)' }}>
        <div className="glass-panel" style={{ padding: '40px', width: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Lumina <span className="gradient-text">CRM</span></h2>
          <p style={{ color: 'var(--text-secondary)' }}>Login with admin@example.com / password</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', color: 'white' }} 
              type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input 
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', color: 'white' }} 
              type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button className="btn-primary" type="submit">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className="gradient-text">Lumina</span> CRM
        </div>
        <nav style={{ flex: 1 }}>
          {['Overview', 'Leads', 'Properties', 'Team'].map(item => (
            <div key={item} onClick={() => setActiveTab(item)} className={`${styles.navItem} ${activeTab === item ? styles.active : ''}`}>
              {item}
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Role: <strong style={{ color: 'var(--status-info)' }}>{role?.toUpperCase()}</strong></div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-accent)', color: 'var(--danger)' }}>Logout</button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>{activeTab}</div>
          <div className={styles.profile}>
            <button className="btn-primary" onClick={() => setShowAddLead(true)}>+ New Lead</button>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.statsGrid}>
            <div className={`glass-panel interactive-hover ${styles.statCard}`}>
              <span className={styles.statLabel}>Total Active Leads</span>
              <span className={styles.statValue}>{leads.length || 0}</span>
            </div>
            <div className={`glass-panel interactive-hover ${styles.statCard}`}>
              <span className={styles.statLabel}>Available Properties</span>
              <span className={styles.statValue}>{properties.filter(p => p.status === 'Available').length || 0}</span>
            </div>
            <div className={`glass-panel interactive-hover ${styles.statCard}`}>
              <span className={styles.statLabel}>Revenue Projected</span>
              <span className="gradient-text">+ $1.2M</span>
            </div>
          </div>

          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Leads Directory</h2>
          </div>
          
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <table className={styles.leadsTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: 500 }}>{lead.name}</td>
                    <td>
                      <div style={{ color: 'var(--text-primary)' }}>{lead.email}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{lead.phone}</div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${lead.status === 'New' ? styles.statusNew : styles.statusContacted}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ color: 'var(--brand-primary)', padding: '6px 12px', background: 'var(--bg-accent)', borderRadius: '6px', fontWeight: 500 }}>Contact</button>
                      <button onClick={() => deleteLead(lead.id)} style={{ color: 'var(--danger)', padding: '6px 12px', background: 'rgba(255,68,58,0.1)', borderRadius: '6px', fontWeight: 500 }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Lead Modal Overlay */}
      {showAddLead && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Add Custom Lead</h3>
            <form onSubmit={submitNewLead} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', color: 'white' }} type="text" placeholder="Name" required value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} />
              <input style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', color: 'white' }} type="text" placeholder="Phone" required value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} />
              <input style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', color: 'white' }} type="email" placeholder="Email" required value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddLead(false)} style={{ padding: '10px 20px', color: 'var(--text-secondary)' }}>Cancel</button>
                <button type="submit" className="btn-primary">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
