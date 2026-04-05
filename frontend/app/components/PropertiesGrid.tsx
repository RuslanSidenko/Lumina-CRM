'use client'

import { Property } from '../types';
import { useTranslations } from 'next-intl';

interface PropertiesGridProps {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
}

const STATUS_CHIP = {
  Available: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Sold:      'bg-red-500/15    text-red-400    border-red-500/25',
  Pending:   'bg-amber-500/15  text-amber-400  border-amber-500/25',
};

export default function PropertiesGrid({ properties, onPropertyClick }: PropertiesGridProps) {
  const t = useTranslations('Properties');

  if (!properties || properties.length === 0) {
    return (
      <div className="card p-20 text-center text-n-400 text-sm">
        {t('no_properties')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {properties.map(p => (
        <div
          key={p.id}
          onClick={() => onPropertyClick(p)}
          className="card group cursor-pointer hover:border-accent-500/40 hover:bg-n-600 transition-all duration-200 overflow-hidden flex flex-col"
        >
          {/* Image */}
          <div className="relative h-44 overflow-hidden bg-n-900">
            <img
              src={p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'}
              alt={p.title}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-n-900/80 via-transparent to-transparent" />
            {/* Status */}
            <span className={`absolute top-3 left-3 badge border text-[10px] ${STATUS_CHIP[p.status as keyof typeof STATUS_CHIP] || STATUS_CHIP.Available}`}>
              {p.status}
            </span>
            {/* Price overlay */}
            <div className="absolute bottom-3 left-3">
              <span className="text-xl font-black text-white drop-shadow">${p.price.toLocaleString()}</span>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 flex flex-col gap-1 flex-1">
            <h3 className="font-semibold text-n-50 text-sm truncate group-hover:text-accent-400 transition-colors">{p.title}</h3>
            <p className="text-xs text-n-400 flex items-center gap-1 truncate">
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {p.address || 'Address not listed'}
            </p>

            {/* Specs */}
            <div className="flex items-center gap-4 mt-2 pt-3 border-t border-n-500/50">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-n-100">{p.bedrooms}</span>
                  <span className="text-[10px] text-n-400 font-medium uppercase">{t('beds').slice(0, 2)}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-n-100">{p.bathrooms}</span>
                  <span className="text-[10px] text-n-400 font-medium uppercase">{t('baths').slice(0, 2)}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-n-100">{p.area}</span>
                  <span className="text-[10px] text-n-400 font-medium uppercase">{t('sqft')}</span>
                </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
