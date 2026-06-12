import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan';
  delay?: number;
}

const colorClasses: Record<string, string> = {
  blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
  green: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
  amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
  red: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-400',
  purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
  cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  color = 'blue',
  delay = 0,
}) => {
  return (
    <div
      className={cn(
        'relative p-5 rounded-xl border bg-gradient-to-br backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:shadow-lg',
        colorClasses[color]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono tracking-tight">{value}</span>
            {unit && <span className="text-sm text-slate-400">{unit}</span>}
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs',
              trend.isUp ? 'text-emerald-400' : 'text-red-400'
            )}>
              {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trend.value}% 较昨日</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          'p-3 rounded-xl bg-gradient-to-br',
          `from-${color}-500/30 to-${color}-500/10`
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
