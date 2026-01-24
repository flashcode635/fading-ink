import { memo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Percent, Clock, AlertTriangle, Edit3 } from 'lucide-react';
import { formatAge } from '@/lib/decay';

interface StatsPanelProps {
  totalSections: number;
  averageDecay: number;
  criticalSections: number;
  documentAge: number;
  totalEdits: number;
}

export const StatsPanel = memo(function StatsPanel({
  totalSections,
  averageDecay,
  criticalSections,
  documentAge,
  totalEdits,
}: StatsPanelProps) {
  const stats = [
    {
      icon: FileText,
      label: 'Sections',
      value: totalSections,
    },
    {
      icon: Percent,
      label: 'Avg Decay',
      value: `${Math.round(averageDecay)}%`,
      warning: averageDecay > 50,
    },
    {
      icon: AlertTriangle,
      label: 'Critical',
      value: criticalSections,
      warning: criticalSections > 0,
    },
    {
      icon: Clock,
      label: 'Age',
      value: formatAge(documentAge),
    },
    {
      icon: Edit3,
      label: 'Edits',
      value: totalEdits,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="stats-panel flex flex-wrap items-center justify-center gap-4 md:gap-6 
                 py-3 px-4 bg-card/50 border-b border-border"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`flex items-center gap-2 ${
            stat.warning ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          <stat.icon className="w-3.5 h-3.5" />
          <span className="text-xs">
            {stat.label}: <strong className="text-foreground">{stat.value}</strong>
          </span>
        </div>
      ))}
    </motion.div>
  );
});
