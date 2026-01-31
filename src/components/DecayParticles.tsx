'use client';

import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DecayParticle } from '@/types/document';
import { generateId } from '@/lib/decay';

interface DecayParticlesProps {
  averageDecay: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const DecayParticles = memo(function DecayParticles({ 
  averageDecay,
  containerRef 
}: DecayParticlesProps) {
  const [particles, setParticles] = useState<DecayParticle[]>([]);

  useEffect(() => {
    if (averageDecay < 30) {
      setParticles([]);
      return;
    }

    const interval = setInterval(() => {
      const particleCount = Math.floor(averageDecay / 20);
      
      if (particles.length < particleCount * 3 && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newParticle: DecayParticle = {
          id: generateId(),
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2 - 1,
          opacity: 0.3 + Math.random() * 0.4,
          size: 2 + Math.random() * 3,
        };
        
        setParticles(prev => [...prev.slice(-20), newParticle]);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [averageDecay, containerRef]);

  // Remove old particles
  useEffect(() => {
    const cleanup = setInterval(() => {
      setParticles(prev => prev.slice(-15));
    }, 2000);

    return () => clearInterval(cleanup);
  }, []);

  if (averageDecay < 30) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="decay-particle"
            initial={{
              x: particle.x,
              y: particle.y,
              opacity: particle.opacity,
              scale: 0,
            }}
            animate={{
              x: particle.x + particle.vx * 50,
              y: particle.y + particle.vy * 100,
              opacity: 0,
              scale: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: 'easeOut' }}
            style={{
              width: particle.size,
              height: particle.size,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});
