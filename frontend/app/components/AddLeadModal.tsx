import { useState, useEffect, FormEvent } from 'react';
import { API_BASE } from '../config';

interface AddLeadModalProps {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddLeadModal({ token, onClose, onSuccess }: AddLeadModalProps) {
  const [newLead, setNewLead] = useState<any>({ name: '', phone: '', email: '', status: 'New', assigned_to: null, custom_fields: {} });
  const [customFieldDefs, setCustomFieldDefs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/custom-fields?entity_type=lead`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCustomFieldDefs(Array.isArray(data) ? data : []));

    fetch(`${API_BASE}/api/v1/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);

  const submitNewLead = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`${API_BASE}/api/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(newLead)
    });

    setLoading(false);
    if (res.ok) {
      onSuccess();
    } else {
      const errorData = await res.json().catch(() => ({}));
      alert("Failed to add lead. Error: " + errorData.error);
    }
  };

  const handleCustomFieldChange = (label: string, value: any) => {
    setNewLead({
      ...newLead,
      custom_fields: {
        ...newLead.custom_fields,
        [label]: value
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm transition-all duration-300">
      <div className="glass-panel w-full max-w-md p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h3 className="text-2xl font-bold tracking-tight">Add New Lead</h3>

        <form onSubmit={submitNewLead} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 ml-1">Full Name <span className="text-red-500">*</span></label>
            <input
              className="input-field"
              type="text"
              placeholder="John Doe"
              required
              value={newLead.name}
              onChange={e => setNewLead({ ...newLead, name: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 ml-1">Phone Number <span className="text-red-500">*</span></label>
            <input
              className="input-field"
              type="tel"
              placeholder="+1 555-0199"
              required
              value={newLead.phone}
              onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 ml-1">Email Address</label>
            <input
              className="input-field"
              type="email"
              placeholder="john@example.com"
              value={newLead.email}
              onChange={e => setNewLead({ ...newLead, email: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1">
            <label className="text-xs font-medium text-slate-400 ml-1">Status <span className="text-red-500">*</span></label>
            <select
                className="input-field"
                required
                value={newLead.status}
                onChange={e => setNewLead({ ...newLead, status: e.target.value })}
            >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Active">Active</option>
                <option value="Lost">Lost</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Ignored">Ignored</option>
            </select>
          </div>          <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1">
            <label className="text-xs font-medium text-slate-400 ml-1">Assigned To</label>
            <select
                className="input-field"
                value={newLead.assigned_to || ""}
                onChange={e => setNewLead({ ...newLead, assigned_to: e.target.value ? parseInt(e.target.value) : null })}
            >
                <option value="">Unassigned</option>
                {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
            </select>
          </div>

          {customFieldDefs.map(field => (
            <div key={field.id} className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1">
              <label className="text-xs font-medium text-slate-400 ml-1">
                {field.label} {field.is_required && <span className="text-red-500">*</span>}
              </label>
              {field.field_type === 'select' ? (
                <select
                  className="input-field"
                  required={field.is_required}
                  onChange={e => handleCustomFieldChange(field.label, e.target.value)}
                >
                  <option value="">Select {field.label}</option>
                  {(field.options || []).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.field_type === 'number' ? 'number' : 'text'}
                  className="input-field"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  required={field.is_required}
                  onChange={e => handleCustomFieldChange(field.label, e.target.value)}
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
