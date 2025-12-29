import React from 'react';

interface StatusBadgeProps {
    status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const getStyles = (status: string) => {
        switch (status) {
            case 'Realizada':
                return {
                    bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500'
                };
            case 'Agendada':
                return {
                    bg: 'bg-primary/10', text: 'text-primary-dark', dot: 'bg-primary'
                };
            default: // Falta, Cancelada
                return {
                    bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500'
                };
        }
    };

    const styles = getStyles(status);

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${styles.bg} ${styles.text}`}>
            <span className={`size-1.5 rounded-full ${styles.dot}`}></span>
            {status}
        </span>
    );
};

export default StatusBadge;
