'use client'

import { useState, useEffect } from 'react';
import { Property } from '../types';
import { API_BASE } from '../config';

interface PropertyFieldsViewProps {
  property: Property;
  token: string;
  onUpdate: () => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

interface CustomFieldDefinition {
  id: number;
  entity_type: 'lead' | 'property';
  label: string;
  field_type: 'text' | 'number' | 'select';
  options?: string[];
  is_required: boolean;
}

export default function PropertyFieldsView({ property, token, onUpdate, notify }: PropertyFieldsViewProps) {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [restrictedFields, setRestrictedFields] = useState<string[]>([]);


  useEffect(() => {
    fetchCustomFields();
    fetchPermissions();
  }, []);


  const fetchPermissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRestrictedFields(data.restricted_fields?.properties || []);
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  const fetchCustomFields = async () => {

    try {
      const res = await fetch(`${API_BASE}/api/v1/custom-fields`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const allFields: CustomFieldDefinition[] = await res.json();
        setFields(allFields.filter(f => f.entity_type === 'property'));
      }
    } catch (err) {
      console.error('Failed to fetch custom fields:', err);
    }
  };

  const startEditing = (fieldName: string, value: any) => {
    setEditingField(fieldName);
    setEditValue(value);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue(null);
  };

  const handleUpdate = async (fieldName: string, value: any) => {
    setIsUpdating(true);
    try {
      let updatedProperty = { ...property };

      if (fieldName.startsWith('custom_')) {
        const customKey = fieldName.replace('custom_', '');
        updatedProperty.custom_fields = {
          ...updatedProperty.custom_fields,
          [customKey]: value
        };
      } else {
        (updatedProperty as any)[fieldName] = value;
      }

      const res = await fetch(`${API_BASE}/api/v1/properties/${property.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedProperty)
      });

      if (res.ok) {
        if (onUpdate) onUpdate();
        setEditingField(null);
        notify(`${fieldName.replace('custom_', '')} updated successfully`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        notify(errorData.error || "Failed to update property.", "error");
      }
    } catch (err) {
      console.error('Failed to update property:', err);
      notify("Network error occurred.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const renderField = (label: string, fieldName: string, value: any, type: string = 'text') => {
    const isRestricted = restrictedFields.some(rf => 
      rf.toLowerCase() === fieldName.toLowerCase() || 
      (fieldName.startsWith('custom_') && rf.toLowerCase() === fieldName.replace('custom_', '').toLowerCase())
    );
    const isEditing = editingField === fieldName;

    return (
      <div className="flex flex-col gap-1.5 group">
        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex justify-between items-center">
          {label}
          {!isEditing && !isRestricted && (
            <button
              onClick={() => startEditing(fieldName, value)}
              className="opacity-0 group-hover:opacity-100 text-brand-400 hover:text-brand-300 transition-all text-[9px] font-bold"
            >
              EDIT
            </button>
          )}
          {isRestricted && (
            <span className="text-slate-600 text-[8px] font-bold flex items-center gap-1">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              READ ONLY
            </span>
          )}
        </label>


        {isEditing ? (
          <div className="flex gap-2 animate-in slide-in-from-top-1 duration-200">
            <input
              type={type}
              className="input-field py-1 bg-slate-900 border-brand-500/50"
              value={editValue || ''}
              onChange={(e) => setEditValue(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdate(fieldName, editValue);
                if (e.key === 'Escape') cancelEditing();
              }}
            />
            <button
              onClick={() => handleUpdate(fieldName, editValue)}
              disabled={isUpdating}
              className="p-1 text-green-400 hover:bg-green-500/10 rounded disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
            <button
              onClick={cancelEditing}
              className="p-1 text-red-400 hover:bg-red-500/10 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ) : (
          <div
            className={`text-slate-200 font-medium py-1 px-3 border border-transparent rounded transition-all truncate ${isRestricted ? 'cursor-not-allowed bg-white/[0.01]' : 'hover:border-white/5 cursor-pointer'}`}
            onClick={() => !isRestricted && startEditing(fieldName, value)}
          >
            {type === 'number' && typeof value === 'number' ? value.toLocaleString() : (value || <span className="text-slate-600 italic">Not set</span>)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-white/[0.02] rounded-3xl border border-white/5">
      {renderField('Title', 'title', property.title)}
      {renderField('Address', 'address', property.address)}
      {renderField('Price', 'price', property.price, 'number')}
      {renderField('Bedrooms', 'bedrooms', property.bedrooms, 'number')}
      {renderField('Bathrooms', 'bathrooms', property.bathrooms, 'number')}
      {renderField('Area (sq ft)', 'area', property.area, 'number')}
      {renderField('Status', 'status', property.status)}

      {fields.map(f => (
        <div key={f.id}>
          {renderField(f.label, `custom_${f.label}`, property.custom_fields?.[f.label], f.field_type === 'number' ? 'number' : 'text')}
        </div>
      ))}
    </div>
  );
}
