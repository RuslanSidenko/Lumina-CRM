'use client'

import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

interface RolePermission {
  id: number;
  role_name: string;
  resource: string;
  can_view: boolean;
  can_view_all: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_edit_all: boolean;
  can_delete: boolean;
  restricted_fields: string[];
}

interface RoleManagementProps {
  token: string;
}

const AVAILABLE_FIELDS: Record<string, string[]> = {
  leads: ['name', 'phone', 'email', 'status', 'assigned_to'],
  properties: ['title', 'address', 'description', 'price', 'bedrooms', 'bathrooms', 'area', 'status', 'agent_id', 'images'],
  deals: ['lead_id', 'property_id', 'agent_id', 'price', 'status', 'close_date'],
  tasks: ['lead_id', 'property_id', 'agent_id', 'title', 'description', 'due_at', 'status'],
  interactions: ['lead_id', 'agent_id', 'type', 'content'],
  users: ['name', 'email', 'role', 'password'],
  custom_fields: ['entity_type', 'label', 'field_type', 'options', 'is_required'],
  meetings: ['lead_id', 'agent_id', 'title', 'provider', 'meeting_link', 'start_time', 'end_time', 'status']
};

export default function RoleManagement({ token }: RoleManagementProps) {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoleName, setNewRoleName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [activeSelector, setActiveSelector] = useState<number | null>(null);

  useEffect(() => {
    fetchPermissions();
    fetchCustomFields();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.map((p: any) => ({
          ...p,
          restricted_fields: p.restricted_fields || []
        })));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchCustomFields = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/custom-fields`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setCustomFields(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const getAvailableFieldsForResource = (resource: string) => {
    const standard = AVAILABLE_FIELDS[resource] || [];
    if (resource === 'leads' || resource === 'properties') {
      const relevantCustom = customFields
        .filter(cf => cf.entity_type === (resource === 'leads' ? 'lead' : 'property'))
        .map(cf => cf.label);
      return [...standard, ...relevantCustom];
    }
    return standard;
  };

  const updatePermission = async (id: number, updates: Partial<RolePermission>) => {
    const original = permissions.find(p => p.id === id);
    if (!original) return;

    const updated = { ...original, ...updates };

    try {
      const res = await fetch(`${API_BASE}/api/v1/roles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });

      if (res.ok) {
        setPermissions(permissions.map(p => p.id === id ? updated : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRestrictedField = (permId: number, field: string) => {
    const perm = permissions.find(p => p.id === permId);
    if (!perm) return;

    let newRestricted = [...perm.restricted_fields];
    if (newRestricted.includes(field)) {
      newRestricted = newRestricted.filter(f => f !== field);
    } else {
      newRestricted.push(field);
    }
    updatePermission(permId, { restricted_fields: newRestricted });
  };

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;
    setIsCreating(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role_name: newRoleName })
      });

      if (res.ok) {
        setNewRoleName('');
        fetchPermissions();
      }
    } catch (err) {
      console.error(err);
    }
    setIsCreating(false);
  };

  const getRoles = () => Array.from(new Set(permissions.map(p => p.role_name)));

  if (loading) return <div className="p-12 text-center text-slate-500">Loading RBAC settings...</div>;

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">RBAC Control Center</h2>
          <p className="text-sm text-slate-500 mt-1">Manage granular permissions and row-level access for every role.</p>
        </div>
        <form onSubmit={createRole} className="flex gap-2">
          <input
            type="text"
            placeholder="New Role Name (e.g. Manager)"
            className="input-field bg-white/5 py-2 px-4 text-sm w-64"
            value={newRoleName}
            onChange={e => setNewRoleName(e.target.value)}
          />
          <button type="submit" disabled={isCreating} className="btn-primary py-2 px-4 text-sm">
            {isCreating ? 'Creating...' : 'Add Role'}
          </button>
        </form>
      </div>

      <div className="space-y-12">
        {getRoles().map(role => (
          <div key={role} className="flex flex-col gap-4">
            <div className="flex items-center gap-4 px-2">
              <h3 className="text-lg font-bold text-brand-400 capitalize">{role}</h3>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>

            <div className="glass-panel overflow-visible border border-white/5 bg-white/[0.02]">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="px-6 py-4">Resource</th>
                    <th className="px-4 py-4 text-center">View</th>
                    <th className="px-4 py-4 text-center">View All</th>
                    <th className="px-4 py-4 text-center">Create</th>
                    <th className="px-4 py-4 text-center">Edit</th>
                    <th className="px-4 py-4 text-center">Edit All</th>
                    <th className="px-4 py-4 text-center">Delete</th>
                    <th className="px-6 py-4">Restricted Fields</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {permissions.filter(p => p.role_name === role).map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-300 capitalize">{p.resource}</td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={p.can_view}
                          onChange={e => updatePermission(p.id, { can_view: e.target.checked })}
                          className="rounded bg-slate-900 border-white/10 text-brand-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={p.can_view_all}
                          onChange={e => updatePermission(p.id, { can_view_all: e.target.checked })}
                          className="rounded bg-slate-900 border-white/10 text-brand-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={p.can_create}
                          onChange={e => updatePermission(p.id, { can_create: e.target.checked })}
                          className="rounded bg-slate-900 border-white/10 text-brand-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={p.can_edit}
                          onChange={e => updatePermission(p.id, { can_edit: e.target.checked })}
                          className="rounded bg-slate-900 border-white/10 text-brand-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={p.can_edit_all}
                          onChange={e => updatePermission(p.id, { can_edit_all: e.target.checked })}
                          className="rounded bg-slate-900 border-white/10 text-brand-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={p.can_delete}
                          onChange={e => updatePermission(p.id, { can_delete: e.target.checked })}
                          className="rounded bg-slate-900 border-white/10 text-brand-500"
                        />
                      </td>
                      <td className="px-6 py-4 relative">
                        <div className="flex flex-wrap gap-1 items-center min-h-[32px]">
                          {p.restricted_fields.map(f => (
                            <span key={f} className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1 group/tag">
                              {f}
                              <button onClick={() => toggleRestrictedField(p.id, f)} className="hover:text-red-300">×</button>
                            </span>
                          ))}
                          <button
                            onClick={() => setActiveSelector(activeSelector === p.id ? null : p.id)}
                            className="text-brand-400 hover:text-brand-300 text-xl leading-none ml-1"
                          >
                            +
                          </button>
                        </div>

                        {activeSelector === p.id && (
                          <div className="absolute top-full right-0 z-50 mt-1 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 animate-in zoom-in-95 fade-in duration-200">
                            <div className="max-h-48 overflow-y-auto">
                              {getAvailableFieldsForResource(p.resource).map(field => (
                                <label key={field} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={p.restricted_fields.includes(field)}
                                    onChange={() => toggleRestrictedField(p.id, field)}
                                    className="rounded bg-slate-800 border-white/10 text-brand-500"
                                  />
                                  <span className="text-[11px] text-slate-300 group-hover:text-white">{field}</span>
                                </label>
                              ))}
                              {getAvailableFieldsForResource(p.resource).length === 0 && <p className="p-2 text-[11px] text-slate-500 text-center italic">No fields available</p>}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
