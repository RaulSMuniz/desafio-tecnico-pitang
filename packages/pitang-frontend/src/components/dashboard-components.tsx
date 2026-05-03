import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    description?: string;
    variant?: 'default' | 'warning' | 'success' | 'danger';
}

export function StatsCard({ label, value, icon: Icon, description, variant = 'default' }: StatsCardProps) {
    const valueColors = {
        default: 'text-slate-900',
        warning: 'text-yellow-600',
        success: 'text-green-600',
        danger: 'text-red-600',
    };

    return (
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-orange-200 transition-all group">
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                {Icon && <Icon className="h-4 w-4 text-slate-300 group-hover:text-orange-500 transition-colors" />}
            </div>
            <div className="flex flex-col">
                <p className={`text-3xl font-black tracking-tight ${valueColors[variant]}`}>{value}</p>
                {description && <p className="text-[10px] text-slate-400 font-medium mt-1">{description}</p>}
            </div>
        </div>
    );
}

interface EmptyStateProps {
    profile?: string;
}

export function DashboardEmptyState({ profile }: EmptyStateProps) {
    return (
        <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/50 min-h-[400px] animate-in fade-in duration-500">
            <div className="bg-slate-100 p-6 rounded-full mb-6 text-3xl shadow-inner">
                📋
            </div>
            <h3 className="text-lg font-bold text-slate-600">Nada por aqui ainda</h3>
            <p className="text-center text-sm font-medium text-slate-400 mt-1 max-w-xs">
                Ainda não há solicitações registradas para o perfil {profile}.
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mt-6">
                Novos itens aparecerão automaticamente
            </p>
        </div>
    );
}
