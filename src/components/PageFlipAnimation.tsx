import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageFlipAnimationProps {
  children: ReactNode;
  isFlipping: boolean;
  onFlipComplete?: () => void;
}

export function PageFlipAnimation({ 
  children, 
  isFlipping,
  onFlipComplete 
}: PageFlipAnimationProps) {
  return (
    <div className="page-flip-container">
      <motion.div
        className="page-flipping"
        initial={false}
        animate={isFlipping ? {
          rotateY: -180,
          z: 50,
          translateY: -10,
        } : {
          rotateY: 0,
          z: 0,
          translateY: 0,
        }}
        transition={{
          duration: 1.2,
          ease: [0.43, 0.13, 0.23, 0.96],
        }}
        onAnimationComplete={() => {
          if (isFlipping && onFlipComplete) {
            onFlipComplete();
          }
        }}
        style={{
          transformOrigin: 'left center',
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
        
        {/* Page curl shadow during flip */}
        {isFlipping && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            style={{
              background: 'linear-gradient(90deg, transparent 60%, rgba(0,0,0,0.2) 100%)',
              transformStyle: 'preserve-3d',
              transform: 'translateZ(1px)',
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
