import React from 'react';

interface ChartCardProps {
    title: string;
    subtitle: string;
    icon: string;
    iconColorClass: string;
    iconBgClass: string;
    children: React.ReactNode;
    loading?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, icon, iconColorClass, iconBgClass, children, loading }) => {
    return (
        <div className="bg-white dark:bg-surface-dark p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6 h-full">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className={`size-12 rounded-2xl ${iconBgClass} flex items-center justify-center ${iconColorClass}`}>
                    <span className="material-symbols-outlined text-[24px]">{icon}</span>
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{subtitle}</p>
                </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[250px] pr-2 flex-1">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between">
                                    <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                                    <div className="h-3 w-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
};

export default ChartCard;
