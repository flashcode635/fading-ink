'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bruise } from '@/types/document';

interface BackgroundAgingProps {
  yellowing: number;
  bruises: Bruise[];
  pageDecay?: number;
}

export const BackgroundAging = memo(function BackgroundAging({ 
  yellowing,
  bruises,
  pageDecay = 0,
}: BackgroundAgingProps) {
  const yellowingOpacity = yellowing / 100;
  const sepiaAmount = 0.1 + (yellowing / 100) * 0.6;
  const roughnessIntensity = Math.min(pageDecay / 100, 0.8);
  const grainOpacity = 0.03 + (pageDecay / 100) * 0.12;

  return (
    <>
      {/* Yellowing overlay with progressive aging */}
      <div
        className="yellowing-overlay"
        style={{ 
          '--yellowing-opacity': yellowingOpacity,
          opacity: yellowingOpacity * 0.6,
          background: `linear-gradient(
            135deg, 
            hsl(43, 40%, ${92 - yellowing * 0.2}%) 0%, 
            hsl(38, 45%, ${88 - yellowing * 0.25}%) 50%,
            hsl(35, 50%, ${85 - yellowing * 0.3}%) 100%
          )`,
        } as React.CSSProperties}
      />

      {/* Paper roughness/texture overlay that intensifies with decay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-multiply"
        style={{
          opacity: roughnessIntensity * 0.3,
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Water damage / discoloration patches */}
      {pageDecay > 30 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: (pageDecay - 30) / 100 * 0.15 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 40% 30% at 20% 80%, rgba(139, 115, 85, 0.2) 0%, transparent 70%),
                        radial-gradient(ellipse 30% 40% at 85% 20%, rgba(120, 100, 70, 0.15) 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Edge darkening that increases with decay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.1 + pageDecay / 100 * 0.3,
          background: `linear-gradient(to right, rgba(80,60,40,0.15) 0%, transparent 5%, transparent 95%, rgba(80,60,40,0.15) 100%),
                      linear-gradient(to bottom, rgba(80,60,40,0.1) 0%, transparent 3%, transparent 97%, rgba(80,60,40,0.2) 100%)`,
        }}
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

      {/* Dynamic grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none paper-grain-overlay"
        style={{ opacity: grainOpacity }}
      />

      {/* Sepia filter overlay (applied via CSS) */}
      <style>
        {`
          .document-paper {
            filter: sepia(${sepiaAmount}) contrast(${1 - pageDecay / 500});
          }
        `}
      </style>
    </>
  );
});
