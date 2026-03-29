'use client'

import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';

interface MeetingConnectionsProps {
  token: string;
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function MeetingConnections({ token, notify }: MeetingConnectionsProps) {
  const [connections, setConnections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, [token]);

  const fetchConnections = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/meetings/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setConnections(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/meetings/auth?provider=${provider}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const { url } = await res.json();
        // Open OAuth in a popup or redirect
        const width = 600, height = 700;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        
        const popup = window.open(
          url,
          `Connect ${provider}`,
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Poll for popup closure to refresh connections
        const timer = setInterval(() => {
          if (popup?.closed) {
            clearInterval(timer);
            fetchConnections();
            notify(`${provider} connected successfully!`);
          }
        }, 1000);
      }
    } catch (e) {
      notify(`Failed to initiate ${provider} connection`, 'error');
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/meetings/connections/${provider}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchConnections();
        notify(`${provider} disconnected`);
      }
    } catch (e) {
      notify(`Failed to disconnect ${provider}`, 'error');
    }
  };

  if (loading) return <div className="p-4 text-n-400">Loading connections...</div>;

  const providers = [
    { id: 'google', name: 'Google Meet / Calendar', icon: 'https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png' },
    { id: 'zoom', name: 'Zoom Meetings', icon: 'https://zoom.us/favicon.ico' }
  ];

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-n-50">Meeting Integrations</h3>
        <p className="text-sm text-n-400 mt-1">Connect your accounts to book meetings directly from lead details.</p>
      </div>

      <div className="space-y-4">
        {providers.map(p => {
          const isConnected = connections.includes(p.id);
          return (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-n-800/40 border border-n-500/30">
              <div className="flex items-center gap-4">
                <img src={p.icon} alt={p.name} className="w-8 h-8 object-contain" />
                <div>
                  <h4 className="font-semibold text-n-100">{p.name}</h4>
                  <p className="text-xs text-n-400">{isConnected ? 'Connected' : 'Not connected'}</p>
                </div>
              </div>
              
              {isConnected ? (
                <button 
                  onClick={() => handleDisconnect(p.id)}
                  className="btn-ghost text-red-400 hover:bg-red-500/10 text-xs px-3 py-1.5"
                >
                  Disconnect
                </button>
              ) : (
                <button 
                  onClick={() => handleConnect(p.id)}
                  className="btn-primary text-xs px-4 py-1.5"
                >
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
