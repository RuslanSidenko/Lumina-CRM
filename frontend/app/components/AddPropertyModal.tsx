'use client'

import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

interface AddPropertyModalProps {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPropertyModal({ token, onClose, onSuccess }: AddPropertyModalProps) {
  const [form, setForm] = useState<any>({
    title: '',
    address: '',
    description: '',
    price: 0,
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    status: 'Available',
    images: [] as string[],
    custom_fields: {}
  });
  const [imageUrl, setImageUrl] = useState('');
  const [customFieldDefs, setCustomFieldDefs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/custom-fields?entity_type=property`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCustomFieldDefs(Array.isArray(data) ? data : []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/v1/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });
    if (res.ok) onSuccess();
  };

  const handleCustomFieldChange = (label: string, value: any) => {
    setForm({
      ...form,
      custom_fields: {
        ...form.custom_fields,
        [label]: value
      }
    });
  };

  const addImage = () => {
    if (imageUrl) {
      setForm({ ...form, images: [...form.images, imageUrl] });
      setImageUrl('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-2xl font-bold mb-6">List New Property</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Property Title <span className="text-red-500">*</span></label>
              <input type="text" required className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Modern Villa with Pool" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Full Address <span className="text-red-500">*</span></label>
              <input type="text" required className="input-field" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Luxury St, Beverly Hills" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Price ($) <span className="text-red-500">*</span></label>
              <input type="number" required className="input-field" value={form.price} onChange={e => setForm({ ...form, price: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Area (Sq Ft) <span className="text-red-500">*</span></label>
              <input type="number" required className="input-field" value={form.area} onChange={e => setForm({ ...form, area: parseInt(e.target.value) })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Beds</label>
                <input type="number" className="input-field" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: parseInt(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Baths</label>
                <input type="number" className="input-field" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: parseInt(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {customFieldDefs.map(field => (
              <div key={field.id} className="animate-in fade-in slide-in-from-top-1">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
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
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
            <textarea className="input-field min-h-[100px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the property features..." />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Images (URLs)</label>
            <div className="flex gap-2 mb-2">
              <input type="text" className="input-field" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://unsplash.com/..." />
              <button type="button" onClick={addImage} className="btn-secondary px-4 py-2 text-sm whitespace-nowrap">Add Image</button>
            </div>
            <div className="flex gap-2 overflow-x-auto py-2">
              {form.images.map((img: string, idx: number) => (
                <div key={idx} className="relative h-16 w-16 flex-shrink-0 group">
                  <img src={img} className="h-full w-full object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, images: form.images.filter((_: any, i: number) => i !== idx) })}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary py-4 mt-2">Publish Listing</button>
        </form>
      </div>
    </div>
  );
}
