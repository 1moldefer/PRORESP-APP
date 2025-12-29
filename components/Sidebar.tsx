
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { t } = useLanguage();
  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', label: t('sidebar.dashboard'), icon: 'dashboard' },
    { path: '/agenda', label: t('sidebar.agenda'), icon: 'calendar_month' },
    { path: '/patients', label: t('sidebar.patients'), icon: 'groups' },
    { path: '/doctors', label: t('sidebar.doctors'), icon: 'stethoscope' },
    { path: '/locations', label: t('sidebar.locations'), icon: 'apartment' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[280px] bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out shrink-0
        lg:static lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex gap-3 items-center">
                <div className="bg-primary/20 rounded-full size-10 flex items-center justify-center text-primary ring-2 ring-primary/10">
                  <span className="material-symbols-outlined text-[28px]">pulmonology</span>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-slate-900 dark:text-white text-base font-bold leading-none">Projeto Respirar</h1>
                  <p className="text-primary text-xs font-semibold leading-normal mt-1">{t('sidebar.subtitle')}</p>
                </div>
              </div>
              {/* Mobile Close Button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive(item.path)
                    ? 'bg-primary/10 border-l-4 border-primary text-primary font-bold'
                    : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                >
                  <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                  <p className="text-sm leading-normal">{item.label}</p>
                </Link>
              ))}
            </nav>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-auto">
            <button
              onClick={() => {
                navigate('/settings');
                setMobileOpen(false);
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full mb-2"
            >
              <span className="material-symbols-outlined text-[22px]">settings</span>
              <span className="text-sm font-medium">{t('sidebar.settings')}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors w-full text-left"
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
              <span className="text-sm font-medium">{t('sidebar.logout')}</span>
            </button>
            <div
              onClick={() => {
                navigate('/profile');
                setMobileOpen(false);
              }}
              className="flex items-center gap-3 mt-6 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <img
                src={user?.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop"}
                alt="Profile"
                className="size-9 rounded-full object-cover ring-2 ring-primary/20"
              />
              <div className="flex flex-col overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}</p>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 truncate">{t('sidebar.logged')}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
