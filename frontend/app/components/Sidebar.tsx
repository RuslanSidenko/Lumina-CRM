import { useRouter } from 'next/navigation';
import { logoutAction } from '../actions/auth';
import { useTranslations } from 'next-intl';

interface SidebarProps {
  role: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  permissions: any[];
}

const NAV_ITEMS = [
  { name: 'leads',      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { name: 'properties', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'deals',      icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
  { name: 'insights',   icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { name: 'calendar',   icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2' },
];

const ADMIN_ITEMS = [
  { name: 'fields', icon: 'M4 6h16M4 12h8m-8 6h16' },
  { name: 'team',   icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { name: 'roles',  icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { name: 'api',    icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'backups', icon: 'M4 7v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7M4 7c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2M4 7l8 5 8-5' },
  { name: 'automation', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
];

export default function Sidebar({ role, activeTab, setActiveTab, permissions }: SidebarProps) {
  const t = useTranslations('Sidebar');
  const router = useRouter();
  const canSeeTeam = role === 'admin' || permissions.some(p => p.resource === 'users' && p.can_view);
  const menuItems = [...NAV_ITEMS, ...(role === 'admin' ? ADMIN_ITEMS : [])];

  const handleLogout = async () => {
    await logoutAction();
    router.refresh();
  };

  const NavItem = ({ item }: { item: typeof menuItems[0] }) => {
    const active = activeTab.toLowerCase() === item.name;
    return (
      <button
        onClick={() => {
          const tab = item.name === 'api' ? 'API' : item.name.charAt(0).toUpperCase() + item.name.slice(1);
          setActiveTab(tab);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
          active
            ? 'bg-accent-500/15 text-accent-400 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]'
            : 'text-n-300 hover:text-n-100 hover:bg-n-600'
        }`}
      >
        <svg
          className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? 'text-accent-400' : 'text-n-400 group-hover:text-n-200'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
        </svg>
        {t(item.name)}
        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-400" />}
      </button>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-n-900 border-r border-n-500/60 flex flex-col z-50 select-none">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-n-500/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-500 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-base font-bold text-n-50 tracking-tight">Lumina<span className="text-accent-400">CRM</span></span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="section-title px-3 mb-3">{t('workspace')}</p>
        {NAV_ITEMS.map(item => <NavItem key={item.name} item={item} />)}

        {role === 'admin' && (
          <>
            <div className="border-t border-n-500/40 my-3" />
            <p className="section-title px-3 mb-3">{t('admin')}</p>
            {ADMIN_ITEMS.filter(item => item.name !== 'team').map(item => <NavItem key={item.name} item={item} />)}
          </>
        )}

        {canSeeTeam && (
          <>
            <div className="border-t border-n-500/40 my-3" />
            <p className="section-title px-3 mb-3">{t('management')}</p>
            <NavItem item={ADMIN_ITEMS.find(i => i.name === 'team')!} />
          </>
        )}

        <div className="border-t border-n-500/40 my-3" />
        <NavItem item={{ name: 'settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }} />
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-n-500/40 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-accent-400 font-bold text-sm uppercase">
            {role[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-n-100 truncate">{t('my_account')}</p>
            <p className="text-[11px] text-n-300 uppercase font-bold">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-n-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t('sign_out')}
        </button>
      </div>
    </aside>
  );
}
