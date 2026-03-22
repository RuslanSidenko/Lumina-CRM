'use client'

import { useState, useEffect } from 'react';

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
    const res = await fetch('http://localhost:8080/api/v1/custom-fields', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setFields(await res.json());
    setLoading(false);
  };

  const addField = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:8080/api/v1/custom-fields', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(newField)
    });
    if (res.ok) {
      setShowAdd(false);
      setNewField({ entity_type: 'lead', label: '', field_type: 'text', is_required: false, options: [] });
      fetchFields();
    }
  };

  const deleteField = async (id: number) => {
    if (!confirm('Delete this field? Existing data for this field will be hidden.')) return;
    const res = await fetch(`http://localhost:8080/api/v1/custom-fields/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchFields();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Custom Fields</h2>
        <button 
          onClick={() => setShowAdd(true)}
          className="btn-primary py-2 px-4 text-sm"
        >
          Add Custom Field
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FieldSection 
          title="Leads Fields" 
          fields={fields.filter(f => f.entity_type === 'lead')} 
          onDelete={deleteField}
        />
        <FieldSection 
          title="Property Fields" 
          fields={fields.filter(f => f.entity_type === 'property')} 
          onDelete={deleteField}
        />
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-8 relative flex flex-col gap-6" onClick={e => e.stopPropagation()}>
             <button 
              onClick={() => setShowAdd(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <h3 className="text-xl font-bold">New Custom Field</h3>
            <form onSubmit={addField} className="flex flex-col gap-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Entity Type</label>
                  <select 
                    className="input-field"
                    value={newField.entity_type}
                    onChange={e => setNewField({...newField, entity_type: e.target.value})}
                  >
                    <option value="lead">Lead</option>
                    <option value="property">Property</option>
                  </select>
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Field Label</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Budget Range"
                    className="input-field"
                    value={newField.label}
                    onChange={e => setNewField({...newField, label: e.target.value})}
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Field Type</label>
                  <select 
                    className="input-field"
                    value={newField.field_type}
                    onChange={e => setNewField({...newField, field_type: e.target.value})}
                  >
                    <option value="text">Text Input</option>
                    <option value="number">Number</option>
                    <option value="select">Dropdown Select</option>
                  </select>
               </div>
               <div className="flex items-center gap-2">
                 <input 
                  type="checkbox" 
                  id="required"
                  checked={newField.is_required}
                  onChange={e => setNewField({...newField, is_required: e.target.checked})}
                 />
                 <label htmlFor="required" className="text-sm font-medium">Mark as Required</label>
               </div>

               <button type="submit" className="btn-primary py-3 mt-4">Save Field</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldSection({ title, fields, onDelete }: { title: string, fields: CustomField[], onDelete: (id: number) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
      <div className="glass-panel overflow-hidden border border-white/5">
        <ul className="divide-y divide-white/5">
          {fields.map(f => (
            <li key={f.id} className="p-4 flex justify-between items-center group">
              <div>
                <p className="font-bold text-slate-200">{f.label}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400 font-bold uppercase">{f.field_type}</span>
                  {f.is_required && <span className="text-[10px] bg-red-500/10 px-2 py-0.5 rounded text-red-400 font-bold uppercase">Required</span>}
                </div>
              </div>
              <button 
                onClick={() => onDelete(f.id)}
                className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </li>
          ))}
          {fields.length === 0 && (
            <li className="p-8 text-center text-slate-500 text-sm">No custom fields defined.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
