import { useRouter } from 'next/navigation';
import { logoutAction } from '../actions/auth';

interface SidebarProps {
  role: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ role, activeTab, setActiveTab }: SidebarProps) {
  const router = useRouter();
  
  const menuItems = [
    { name: 'Leads', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Properties', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Deals', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Insights', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }
  ];

  if (role === 'admin') {
    menuItems.push({ name: 'Fields', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' });
    menuItems.push({ name: 'Team', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' });
    menuItems.push({ name: 'Roles', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' });
    menuItems.push({ name: 'API', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' });
  }

  const handleLogout = async () => {
    await logoutAction();
    router.refresh();
  };

  return (
    <aside className="w-64 bg-dark-card border-r border-dark-border flex flex-col relative z-20">
      <div className="p-6 border-b border-dark-border">
        <div className="text-2xl font-bold tracking-tight">
          <span className="gradient-text">Lumina</span> CRM
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map(item => (
          <button 
            key={item.name} 
            onClick={() => setActiveTab(item.name)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium flex items-center gap-3 ${
              activeTab === item.name 
                ? 'bg-brand-500/10 text-brand-400 font-semibold shadow-inner shadow-brand-500/5' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            {item.name}
          </button>
        ))}
      </nav>
      
      <div className="p-6 border-t border-dark-border flex flex-col gap-4">
        <div className="bg-slate-800/50 p-3 rounded-xl flex items-center justify-between">
          <span className="text-xs text-slate-400">Role</span>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded uppercase tracking-wider">{role}</span>
        </div>
        <button 
          onClick={handleLogout} 
          className="w-full px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
