'use client'

import { Property } from '../types';
import PropertyFieldsView from './PropertyFieldsView';
import { useTranslations } from 'next-intl';

interface PropertyDetailsModalProps {
  property: Property;
  token: string;
  onClose: () => void;
  onUpdate: () => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const STATUS_CHIP = {
  Available: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Sold:      'bg-red-500/15    text-red-400    border-red-500/25',
  Pending:   'bg-amber-500/15  text-amber-400  border-amber-500/25',
};

export default function PropertyDetailsModal({ property, token, onClose, onUpdate, notify }: PropertyDetailsModalProps) {
  const t = useTranslations('Properties');
  const tc = useTranslations('Common');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel w-full max-w-5xl max-h-[92vh] flex flex-col md:flex-row overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Left — Image panel */}
        <div className="md:w-3/5 bg-n-900 flex flex-col shrink-0 relative overflow-hidden">
          <img
            src={property.images && property.images.length > 0 ? property.images[0] : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1200'}
            alt={property.title}
            className="w-full h-full object-cover"
            style={{ minHeight: '300px', maxHeight: '100%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-n-900/60 via-transparent to-transparent pointer-events-none" />
          {property.images && property.images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-3 overflow-x-auto bg-n-900/70 backdrop-blur-sm">
              {property.images.map((img, i) => (
                <img key={i} src={img} alt="" className="h-14 w-20 object-cover rounded-lg shrink-0 border border-n-500 hover:border-accent-400 opacity-75 hover:opacity-100 transition-all cursor-pointer" />
              ))}
            </div>
          )}
        </div>

        {/* Right — Info panel */}
        <div className="md:w-2/5 flex flex-col bg-n-700 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-n-500/60 shrink-0">
            <span className={`badge border text-[10px] ${STATUS_CHIP[property.status as keyof typeof STATUS_CHIP] || STATUS_CHIP.Available}`}>
              {property.status}
            </span>
            <button onClick={onClose} className="btn-ghost p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 flex-1">
            <div>
              <h2 className="text-xl font-bold text-n-50">{property.title}</h2>
              <p className="text-n-400 text-sm flex items-center gap-1.5 mt-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {property.address || 'Address not listed'}
              </p>
            </div>

            <div className="text-3xl font-extrabold text-n-50 tracking-tight">
              ${property.price.toLocaleString()}
            </div>

            {/* Specs */}
            <div className="grid grid-cols-3 gap-3 py-4 border-y border-n-500/50">
                <div className="text-center">
                  <p className="text-xl font-bold text-n-50">{property.bedrooms}</p>
                  <p className="section-title mt-0.5">{t('beds')}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-n-50">{property.bathrooms}</p>
                  <p className="section-title mt-0.5">{t('baths')}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-n-50">{property.area}</p>
                  <p className="section-title mt-0.5">{t('sqft')}</p>
                </div>
            </div>

            <PropertyFieldsView property={property} token={token} onUpdate={onUpdate} notify={notify} />

            {property.description && (
              <div>
                <p className="section-title mb-2">Description</p>
                <p className="text-n-300 text-sm leading-relaxed">{property.description}</p>
              </div>
            )}

            {property.agent_id && (
              <p className="text-xs text-n-500">Agent ID: #{property.agent_id}</p>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-n-500/60 shrink-0 flex gap-3">
             <button className="btn-primary flex-1 text-sm">{tc('save')}</button>
             <button className="btn-secondary flex-1 text-sm">{tc('close')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
