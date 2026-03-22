interface StatCardsProps {
  totalLeads: number;
  availableProperties: number;
  closedRevenue: number;
}

export default function StatCards({ totalLeads, availableProperties, closedRevenue }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-panel p-6 flex flex-col gap-2 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        </div>
        <span className="text-sm font-medium text-slate-400">Total Leads</span>
        <span className="text-4xl font-bold tracking-tight">{totalLeads}</span>
      </div>
      
      <div className="glass-panel p-6 flex flex-col gap-2 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </div>
        <span className="text-sm font-medium text-slate-400">Listings Available</span>
        <span className="text-4xl font-bold tracking-tight">{availableProperties}</span>
      </div>
      
      <div className="glass-panel p-6 flex flex-col gap-2 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <span className="text-sm font-medium text-slate-400">Closed Revenue</span>
        <span className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
          ${(closedRevenue / 1000).toFixed(1)}k
        </span>
      </div>
    </div>
  );
}
