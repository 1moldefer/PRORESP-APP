import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto pt-12 relative z-10 w-full">
      {/* Divider */}
      <div className="w-full h-px bg-slate-200 dark:bg-slate-800 mb-8"></div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Hospital Info */}
        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <span>HOSPITAL CLÍNICO</span>
          <span className="size-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
          <span>AMBULATÓRIO DE PNEUMOLOGIA</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
          <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
          <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
          <a href="#" className="hover:text-primary transition-colors">Suporte</a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-slate-400 font-medium">
          &copy; {currentYear} Projeto Respirar
        </div>
      </div>
    </footer>
  );
};

export default Footer;
