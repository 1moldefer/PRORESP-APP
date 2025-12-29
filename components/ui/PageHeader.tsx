import React from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
    title: string;
    description?: string;
    actionLabel?: string;
    actionLink?: string;
    actionIcon?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    actionLabel,
    actionLink,
    actionIcon = 'add'
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
                {description && (
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl">{description}</p>
                )}
            </div>

            {actionLink && actionLabel && (
                <Link to={actionLink} className="flex items-center justify-center gap-2 h-12 px-6 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl transition-all shadow-lg shadow-primary/10 hover:shadow-primary/30 active:scale-95">
                    <span className="material-symbols-outlined">{actionIcon}</span>
                    <span>{actionLabel}</span>
                </Link>
            )}
        </div>
    );
};

export default PageHeader;
