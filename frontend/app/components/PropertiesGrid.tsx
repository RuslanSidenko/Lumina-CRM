'use client'

import { Property } from '../types';

interface PropertiesGridProps {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
}

export default function PropertiesGrid({ properties, onPropertyClick }: PropertiesGridProps) {
  if (!properties || properties.length === 0) {
    return (
      <div className="glass-panel p-12 text-center text-slate-400">
        No properties listed yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map(p => (
        <div 
          key={p.id} 
          onClick={() => onPropertyClick(p)}
          className="glass-panel overflow-hidden group cursor-pointer hover:border-brand-500/50 transition-all duration-300 flex flex-col"
        >
          <div className="h-48 overflow-hidden relative">
            <img 
              src={p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'} 
              alt={p.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute top-3 right-3">
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                p.status === 'Available' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
              }`}>
                {p.status}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-xl font-bold text-white">${p.price.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="p-5 flex flex-col gap-3 flex-1">
            <div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-brand-400 transition-colors line-clamp-1">{p.title}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                {p.address || 'Address not listed'}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-dark-border/50">
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-slate-200">{p.bedrooms}</span>
                <span className="text-[10px] text-slate-500 uppercase">Beds</span>
              </div>
              <div className="flex flex-col items-center border-x border-dark-border/50">
                <span className="text-xs font-bold text-slate-200">{p.bathrooms}</span>
                <span className="text-[10px] text-slate-500 uppercase">Baths</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-slate-200">{p.area}</span>
                <span className="text-[10px] text-slate-500 uppercase">Sq Ft</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
