import type { LucideIcon } from 'lucide-react';
import React from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, className }) => {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-zinc-800 bg-[#17181B]/60 p-4 backdrop-blur-md ${className}`}
    >
      {Icon && <Icon size={20} className="text-amber-300" />}
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wider text-zinc-500">{label}</span>
        <span className="text-lg font-medium text-zinc-100">{value}</span>
      </div>
    </div>
  );
};
