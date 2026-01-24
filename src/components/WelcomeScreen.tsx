import { motion } from 'framer-motion';
import { Clock, Edit3, AlertTriangle, Skull, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const features = [
  {
    icon: Clock,
    title: 'Time Decays All',
    description: 'Your words fade and corrupt as seconds pass. Nothing lasts forever.',
  },
  {
    icon: Edit3,
    title: 'Editing Accelerates Entropy',
    description: 'Each edit you make speeds up the decay of everything else. Choose wisely.',
  },
  {
    icon: AlertTriangle,
    title: 'Length Breeds Chaos',
    description: 'Longer documents decay faster. Ambition is punished.',
  },
  {
    icon: Sparkles,
    title: 'Fight to Restore',
    description: 'When text reaches critical decay, you may attempt to restore it—if you can remember what it said.',
  },
];

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4"
    >
      <div className="paper-texture corner-fold page-depth max-w-2xl w-full p-8 md:p-12 relative">
        {/* Decorative stains */}
        <div 
          className="age-stain"
          style={{ 
            top: '10%', 
            right: '5%', 
            width: '80px', 
            height: '60px',
            opacity: 0.15 
          }}
        />
        <div 
          className="coffee-stain"
          style={{ 
            bottom: '15%', 
            left: '8%', 
            width: '100px', 
            height: '100px',
            opacity: 0.1 
          }}
        />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Skull className="w-8 h-8 text-accent" />
            <h1 className="welcome-title text-3xl md:text-4xl text-foreground">
              The Aging Document
            </h1>
          </div>
          <p className="text-muted-foreground text-lg italic">
            An exercise in inevitable loss
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid gap-4 mb-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-start gap-4 p-3 rounded-sm bg-card/50 border border-border/50"
            >
              <feature.icon className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <button
            onClick={onStart}
            className="btn-ink text-lg px-8 py-3 hover:scale-105 transition-transform"
          >
            Begin Writing
          </button>
          <p className="text-xs text-muted-foreground mt-4 italic">
            "Everything you write will eventually be lost. <br />
            The question is: what will you try to save?"
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
