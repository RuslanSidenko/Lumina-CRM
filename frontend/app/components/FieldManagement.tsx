'use client'

import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { useTranslations, useLocale } from 'next-intl';
import { CustomFieldDefinition } from '../types';

interface FieldManagementProps {
  token: string;
}

export default function FieldManagement({ token }: FieldManagementProps) {
  const t = useTranslations('Fields');
  const tc = useTranslations('Common');
  const locale = useLocale();

  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [newField, setNewField] = useState<{
    entity_type: string;
    label: string;
    label_translations: { en: string; ru: string; [key: string]: string };
    field_type: string;
    is_required: boolean;
    options: string[];
  }>({
    entity_type: 'lead',
    label: '',
    label_translations: { en: '', ru: '' },
    field_type: 'text',
    is_required: false,
    options: []
  });
  const [optionInput, setOptionInput] = useState('');

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/custom-fields`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setFields(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addField = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingField;
    const url = isEdit
      ? `${API_BASE}/api/v1/custom-fields/${editingField?.id}`
      : `${API_BASE}/api/v1/custom-fields`;

    // Ensure the internal key (label) is set to a slugified English translation if not already set
    const labelToSave = newField.label || newField.label_translations.en.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...newField,
        label: labelToSave
      })
    });

    if (res.ok) {
      setShowAdd(false);
      setEditingField(null);
      setNewField({
        entity_type: 'lead',
        label: '',
        label_translations: { en: '', ru: '' },
        field_type: 'text',
        is_required: false,
        options: []
      });
      fetchFields();
    }
  };

  const startEdit = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setNewField({
      entity_type: field.entity_type,
      label: field.label,
      label_translations: {
        en: field.label_translations?.en || field.label,
        ru: field.label_translations?.ru || field.label,
        ...(field.label_translations || {})
      },
      field_type: field.field_type,
      is_required: field.is_required,
      options: field.options || []
    });
    setShowAdd(true);
  };

  const deleteField = async (id: number) => {
    if (!confirm(t('delete_confirm'))) return;
    const res = await fetch(`${API_BASE}/api/v1/custom-fields/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchFields();
  };

  const addOption = () => {
    if (!optionInput.trim()) return;
    if (newField.options.includes(optionInput.trim())) return;
    setNewField({
      ...newField,
      options: [...newField.options, optionInput.trim()]
    });
    setOptionInput('');
  };

  const removeOption = (idx: number) => {
    setNewField({
      ...newField,
      options: newField.options.filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-n-800/40 p-5 rounded-3xl border border-white/5 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">{t('title')}</h2>
          <p className="text-xs text-n-400 mt-1 font-medium">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setEditingField(null);
            setNewField({
              entity_type: 'lead',
              label: '',
              label_translations: { en: '', ru: '' },
              field_type: 'text',
              is_required: false,
              options: []
            });
            setShowAdd(true);
          }}
          className="btn-primary py-2.5 px-6 text-xs font-black uppercase tracking-widest flex items-center gap-2 group shadow-lg shadow-accent-500/10"
        >
          <svg className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          {t('add_button')}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-50">
           <div className="h-64 bg-n-900/20 animate-pulse rounded-3xl" />
           <div className="h-64 bg-n-900/20 animate-pulse rounded-3xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FieldSection
            title={t('section_leads')}
            fields={fields.filter(f => f.entity_type === 'lead')}
            onEdit={startEdit}
            onDelete={deleteField}
            locale={locale}
          />
          <FieldSection
            title={t('section_properties')}
            fields={fields.filter(f => f.entity_type === 'property')}
            onEdit={startEdit}
            onDelete={deleteField}
            locale={locale}
          />
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-n-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="card w-full max-w-lg p-8 relative flex flex-col gap-6 animate-in zoom-in-95 duration-300 bg-n-900 shadow-2xl border border-n-500/30" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setShowAdd(false); setEditingField(null); }}
              className="absolute top-6 right-6 text-n-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-black text-white tracking-tighter">
              {editingField ? t('edit_title') : t('new_title')}
            </h3>
            <form onSubmit={addField} className="flex flex-col gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-n-500 tracking-[0.2em]">{t('entity_type')}</label>
                <select
                  className="input-field bg-n-950 border-n-700 focus:border-accent-500"
                   disabled={!!editingField}
                  value={newField.entity_type}
                  onChange={e => setNewField({ ...newField, entity_type: e.target.value })}
                >
                  <option value="lead">{tc('leads')}</option>
                  <option value="property">{tc('properties')}</option>
                </select>
                {editingField && <p className="text-[10px] text-n-600 font-bold mt-1 uppercase tracking-wider">{t('entity_lock')}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-n-500 tracking-[0.2em]">{t('label_en')}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Budget Range"
                      className="input-field bg-n-950 border-n-700"
                      value={newField.label_translations.en}
                      onChange={e => setNewField({ ...newField, label_translations: { ...newField.label_translations, en: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-n-500 tracking-[0.2em]">{t('label_ru')}</label>
                    <input
                      type="text"
                      required
                      placeholder="Напр. Бюджет"
                      className="input-field bg-n-950 border-n-700"
                      value={newField.label_translations.ru}
                      onChange={e => setNewField({ ...newField, label_translations: { ...newField.label_translations, ru: e.target.value } })}
                    />
                  </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-n-500 tracking-[0.2em]">{t('field_type')}</label>
                <select
                  className="input-field bg-n-950 border-n-700"
                  value={newField.field_type}
                  onChange={e => setNewField({ ...newField, field_type: e.target.value })}
                >
                  <option value="text">{t('type_text')}</option>
                  <option value="number">{t('type_number')}</option>
                  <option value="select">{t('type_select')}</option>
                </select>
              </div>

              {newField.field_type === 'select' && (
                <div className="space-y-3 p-4 bg-n-950 rounded-2xl border border-n-800 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black uppercase text-n-500 tracking-[0.2em] block">{t('options_title')}</label>
                  <div className="flex flex-wrap gap-2">
                    {newField.options.map((opt, i) => (
                      <span key={i} className="flex items-center gap-2 px-3 py-1 bg-n-800 border border-n-700 rounded-full text-xs font-bold text-n-100 group">
                        {opt}
                        <button
                          type="button"
                          onClick={() => removeOption(i)}
                          className="text-n-500 hover:text-red-400 p-0.5"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('option_placeholder')}
                      className="flex-1 bg-n-900 border-n-700 rounded-xl text-xs px-4 py-2 focus:border-accent-500 outline-none transition-colors"
                      value={optionInput}
                      onChange={e => setOptionInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                    />
                    <button
                      type="button"
                      onClick={addOption}
                      className="bg-accent-500 hover:bg-accent-400 text-n-950 font-black text-[10px] uppercase px-4 py-2 rounded-xl transition-colors"
                    >
                      {t('add_option')}
                    </button>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-4 p-4 bg-n-950 rounded-2xl border border-n-700 cursor-pointer group hover:border-n-500 transition-colors">
                <input
                  type="checkbox"
                  checked={newField.is_required}
                  onChange={e => setNewField({ ...newField, is_required: e.target.checked })}
                  className="w-5 h-5 rounded bg-n-800 border-n-600 text-accent-500 focus:ring-accent-500 focus:ring-offset-n-950"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-black text-n-100">{t('required_field')}</span>
                  <span className="text-[10px] text-n-500 font-bold uppercase tracking-wider">{t('required_help')}</span>
                </div>
              </label>

              <button type="submit" className="btn-primary py-4 mt-2 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-accent-500/20">
                {editingField ? t('update_button') : t('create_button')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldSection({ title, fields, onEdit, onDelete, locale }: { title: string, fields: CustomFieldDefinition[], onEdit: (f: CustomFieldDefinition) => void, onDelete: (id: number) => void, locale: string }) {
  const t = useTranslations('Fields');

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 px-1">
        <h3 className="text-[10px] font-black text-n-500 uppercase tracking-[0.3em]">{title}</h3>
        <div className="h-px flex-1 bg-n-500/10"></div>
      </div>
      <div className="card overflow-hidden border border-white/5 bg-n-900/30 backdrop-blur-sm shadow-xl">
        <ul className="divide-y divide-white/5">
          {fields.map(f => (
            <li key={f.id} className="p-4 flex justify-between items-center group hover:bg-white/[0.02] transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full ring-4 ${f.is_required ? 'bg-red-500 ring-red-500/10' : 'bg-n-600 ring-n-600/10'}`} title={f.is_required ? 'Required' : 'Optional'}></div>
                <div>
                  <p className="font-black text-n-50 group-hover:text-accent-400 transition-colors text-sm">
                    {f.label_translations?.[locale] || f.label}
                  </p>
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-[9px] bg-n-800 px-2 py-0.5 rounded-md text-n-400 font-black uppercase tracking-[0.15em] border border-n-700/50">{t((`type_${f.field_type}`) as any)}</span>
                    {f.is_required && <span className="text-[9px] bg-red-500/10 px-2 py-0.5 rounded-md text-red-400 font-black uppercase tracking-[0.15em] border border-red-500/20">{t('required')}</span>}
                  </div>
                  {f.field_type === 'select' && f.options && f.options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {f.options.slice(0, 3).map((opt, i) => (
                        <span key={i} className="text-[8px] bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-n-400">{opt}</span>
                      ))}
                      {f.options.length > 3 && <span className="text-[8px] text-n-600 font-bold">+{f.options.length - 3}</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                <button
                  onClick={() => onEdit(f)}
                  className="p-2.5 text-n-500 hover:text-accent-400 hover:bg-accent-500/10 rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button
                  onClick={() => onDelete(f.id)}
                  className="p-2.5 text-n-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </li>
          ))}
          {fields.length === 0 && (
            <li className="p-16 text-center">
              <div className="inline-flex p-5 rounded-3xl bg-n-950 border border-n-800 mb-5 shadow-inner">
                <svg className="w-10 h-10 text-n-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <p className="text-n-500 text-xs font-black uppercase tracking-widest">{t('no_fields')}</p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
