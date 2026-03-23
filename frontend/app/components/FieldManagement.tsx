'use client'

import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

interface FieldManagementProps {
  token: string;
}

interface CustomField {
  id: number;
  entity_type: string;
  label: string;
  field_type: string;
  options: string[];
  is_required: boolean;
}

export default function FieldManagement({ token }: FieldManagementProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [newField, setNewField] = useState({
    entity_type: 'lead',
    label: '',
    field_type: 'text',
    is_required: false,
    options: [] as string[]
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/v1/custom-fields`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setFields(await res.json());
    setLoading(false);
  };

  const addField = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingField;
    const url = isEdit
      ? `${API_BASE}/api/v1/custom-fields/${editingField?.id}`
      : `${API_BASE}/api/v1/custom-fields`;

    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(newField)
    });

    if (res.ok) {
      setShowAdd(false);
      setEditingField(null);
      setNewField({ entity_type: 'lead', label: '', field_type: 'text', is_required: false, options: [] });
      fetchFields();
    }
  };

  const startEdit = (field: CustomField) => {
    setEditingField(field);
    setNewField({
      entity_type: field.entity_type,
      label: field.label,
      field_type: field.field_type,
      is_required: field.is_required,
      options: field.options || []
    });
    setShowAdd(true);
  };

  const deleteField = async (id: number) => {
    if (!confirm('Delete this field? All data associated with this field for all leads/properties will be permanently DELETED.')) return;
    const res = await fetch(`${API_BASE}/api/v1/custom-fields/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchFields();
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl backdrop-blur-md border border-white/5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Custom Data Fields</h2>
          <p className="text-xs text-slate-500 mt-1">Define extra attributes for your Leads and Properties.</p>
        </div>
        <button
          onClick={() => { setEditingField(null); setShowAdd(true); }}
          className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2 group"
        >
          <svg className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New Field
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FieldSection
          title="Leads Profile"
          fields={fields.filter(f => f.entity_type === 'lead')}
          onEdit={startEdit}
          onDelete={deleteField}
        />
        <FieldSection
          title="Property Details"
          fields={fields.filter(f => f.entity_type === 'property')}
          onEdit={startEdit}
          onDelete={deleteField}
        />
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-md p-8 relative flex flex-col gap-6 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setShowAdd(false); setEditingField(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold tracking-tight">
              {editingField ? 'Edit Custom Field' : 'New Custom Field'}
            </h3>
            <form onSubmit={addField} className="flex flex-col gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Entity Type</label>
                <select
                  className="input-field bg-slate-900/50"
                  disabled={!!editingField}
                  value={newField.entity_type}
                  onChange={e => setNewField({ ...newField, entity_type: e.target.value })}
                >
                  <option value="lead">Lead</option>
                  <option value="property">Property</option>
                </select>
                {editingField && <p className="text-[10px] text-slate-600 italic mt-1">Entity type cannot be changed after creation.</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Field Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Budget Range"
                  className="input-field bg-slate-900/50"
                  value={newField.label}
                  onChange={e => setNewField({ ...newField, label: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Field Type</label>
                <select
                  className="input-field bg-slate-900/50"
                  value={newField.field_type}
                  onChange={e => setNewField({ ...newField, field_type: e.target.value })}
                >
                  <option value="text">Text Input</option>
                  <option value="number">Number</option>
                  <option value="select">Dropdown Select</option>
                </select>
              </div>

              <label className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={newField.is_required}
                  onChange={e => setNewField({ ...newField, is_required: e.target.checked })}
                  className="rounded bg-slate-800 border-white/10 text-brand-500 focus:ring-offset-slate-900"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-200">Required Field</span>
                  <span className="text-[10px] text-slate-500">Form validation will prevent empty values.</span>
                </div>
              </label>

              <button type="submit" className="btn-primary py-3.5 mt-2 font-bold shadow-lg shadow-brand-500/10">
                {editingField ? 'Update Field' : 'Create Field'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldSection({ title, fields, onEdit, onDelete }: { title: string, fields: CustomField[], onEdit: (f: CustomField) => void, onDelete: (id: number) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 px-1">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{title}</h3>
        <div className="h-px flex-1 bg-white/5"></div>
      </div>
      <div className="glass-panel overflow-hidden border border-white/5 bg-white/[0.02]">
        <ul className="divide-y divide-white/5">
          {fields.map(f => (
            <li key={f.id} className="p-4 flex justify-between items-center group hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${f.is_required ? 'bg-red-500' : 'bg-slate-700'}`} title={f.is_required ? 'Required' : 'Optional'}></div>
                <div>
                  <p className="font-bold text-slate-200 group-hover:text-white transition-colors capitalize">{f.label}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-slate-800/80 px-2 py-0.5 rounded text-slate-400 font-bold uppercase tracking-wider">{f.field_type}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(f)}
                  className="p-2 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-all"
                  title="Edit Field"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button
                  onClick={() => onDelete(f.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Delete Field"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </li>
          ))}
          {fields.length === 0 && (
            <li className="p-12 text-center">
              <div className="inline-flex p-4 rounded-full bg-white/[0.02] mb-4">
                <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <p className="text-slate-500 text-sm">No custom fields defined.</p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
