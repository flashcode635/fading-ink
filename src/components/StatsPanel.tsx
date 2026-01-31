'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Percent, Clock, AlertTriangle, Edit3, BookOpen } from 'lucide-react';
import { formatAge } from '@/lib/decay';

interface StatsPanelProps {
  totalSections: number;
  averageDecay: number;
  criticalSections: number;
  documentAge: number;
  totalEdits: number;
  totalPages: number;
  currentPage: number;
}

export const StatsPanel = memo(function StatsPanel({
  totalSections,
  averageDecay,
  criticalSections,
  documentAge,
  totalEdits,
  totalPages,
  currentPage,
}: StatsPanelProps) {
  const stats = [
    {
      icon: BookOpen,
      label: 'Pages',
      value: `${currentPage}/${totalPages}`,
    },
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
      className="stats-panel flex flex-wrap items-center justify-center gap-3 md:gap-5 
                 py-3 px-4 bg-card/80 backdrop-blur-sm border-b border-border
                 sticky top-0 z-40"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`flex items-center gap-1.5 ${
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
