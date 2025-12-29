import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    colorClass: string; // e.g. "text-emerald-500"
    loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass, loading }) => {
    return (
        <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className={`size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${colorClass}`}>
                    <span className="material-symbols-outlined text-[24px]">{icon}</span>
                </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-wider mb-1">{title}</p>
            {loading ? (
                <div className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
            ) : (
                <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
            )}
        </div>
    );
};

export default StatCard;
