
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import HelpChatbot from './HelpChatbot';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Projeto Respirar</h1>
          </div>
          <div className="bg-primary/10 rounded-full p-1.5 ring-1 ring-primary/20">
            <span className="material-symbols-outlined text-primary">pulmonology</span>
          </div>
        </div>

        <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          {children}
        </div>

        <HelpChatbot />
      </main>
    </div>
  );
};

export default Layout;
