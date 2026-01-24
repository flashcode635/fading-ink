import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bruise } from '@/types/document';

interface BackgroundAgingProps {
  yellowing: number;
  bruises: Bruise[];
}

export const BackgroundAging = memo(function BackgroundAging({ 
  yellowing,
  bruises 
}: BackgroundAgingProps) {
  const yellowingOpacity = yellowing / 100;
  const sepiaAmount = 0.1 + (yellowing / 100) * 0.6;

  return (
    <>
      {/* Yellowing overlay */}
      <div
        className="yellowing-overlay"
        style={{ 
          '--yellowing-opacity': yellowingOpacity,
          opacity: yellowingOpacity * 0.5,
        } as React.CSSProperties}
      />

      {/* Bruises */}
      <AnimatePresence>
        {bruises.map((bruise) => (
          <motion.div
            key={bruise.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: bruise.opacity }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: 'easeOut' }}
            className="bruise-mark"
            style={{
              left: `${bruise.x}%`,
              top: `${bruise.y}%`,
              width: bruise.width,
              height: bruise.height,
              transform: `rotate(${bruise.rotation}deg)`,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Sepia filter overlay (applied via CSS) */}
      <style>
        {`
          .document-paper {
            filter: sepia(${sepiaAmount});
          }
        `}
      </style>
    </>
  );
});
