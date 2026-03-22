'use client'

import { Property } from '../types';
import PropertyFieldsView from './PropertyFieldsView';

interface PropertyDetailsModalProps {
  property: Property;
  token: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function PropertyDetailsModal({ property, token, onClose, onUpdate }: PropertyDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm transition-all duration-300">
      <div
        className="glass-panel w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          <div className="md:w-3/5 bg-black flex flex-col">
            <div className="flex-1 min-h-[400px]">
              <img
                src={property.images && property.images.length > 0 ? property.images[0] : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1200'}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
            {property.images && property.images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto bg-dark-bg/50">
                {property.images.map((img, idx) => (
                  <img key={idx} src={img} alt="" className="h-20 w-32 object-cover rounded cursor-pointer hover:ring-2 ring-brand-500 transition-all opacity-70 hover:opacity-100" />
                ))}
              </div>
            )}
          </div>

          <div className="md:w-2/5 p-8 flex flex-col gap-6 bg-dark-bg">
            <div>
              <span className="px-2 py-1 rounded bg-brand-500/20 text-brand-400 text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
                {property.status}
              </span>
              <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{property.title}</h2>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {property.address}
              </p>
            </div>

            <div className="text-4xl font-black text-brand-400 tracking-tighter">
              ${property.price.toLocaleString()}
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 border-y border-dark-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{property.bedrooms}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Bedrooms</p>
              </div>
              <div className="text-center border-x border-dark-border">
                <p className="text-2xl font-bold text-white">{property.bathrooms}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Bathrooms</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{property.area}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Sq. Ft.</p>
              </div>
            </div>

            <PropertyFieldsView property={property} token={token} onUpdate={onUpdate} />

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest">Description</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {property.description || "The description for this property is currently being drafted by our agents. Please contact us for more details."}
              </p>
            </div>

            <div className="mt-auto pt-6 flex gap-3">
              <a
                href={`mailto:agent@example.com?subject=Inquiry: ${property.title}`}
                className="btn-primary flex-1 py-3 text-sm text-center"
              >
                Contact Agent
              </a>
              <button className="flex-1 border border-dark-border text-white text-sm hover:bg-white/5 transition-colors py-3 shadow-lg">Schedule Viewing</button>
            </div>
            {property.agent_id && (
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">
                <span>Assigned Agent</span>
                <span>Agent ID: #{property.agent_id}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
