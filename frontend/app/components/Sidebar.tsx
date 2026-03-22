import { useRouter } from 'next/navigation';
import { logoutAction } from '../actions/auth';

interface SidebarProps {
  role: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ role, activeTab, setActiveTab }: SidebarProps) {
  const router = useRouter();
  const tabs = ['Overview', 'Leads', 'Properties', 'Team'];

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
        {tabs.map(item => (
          <button 
            key={item} 
            onClick={() => setActiveTab(item)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${
              activeTab === item 
                ? 'bg-brand-500/10 text-brand-400 font-semibold' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            {item}
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
