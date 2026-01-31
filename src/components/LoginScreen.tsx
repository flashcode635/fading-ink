'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, LogIn, Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginScreen() {
  const [username, setUsername] = useState('');
  const { login, isLoading, error } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      await login(username.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4"
    >
      <div className="paper-texture corner-fold page-depth max-w-md w-full p-8 md:p-12 relative">
        <div 
          className="age-stain"
          style={{ 
            top: '10%', 
            right: '5%', 
            width: '60px', 
            height: '45px',
            opacity: 0.12 
          }}
        />
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <User className="w-8 h-8 text-accent" />
            <h1 className="welcome-title text-2xl md:text-3xl text-foreground">
              Enter Your Name
            </h1>
          </div>
          <p className="text-muted-foreground text-sm italic">
            Your writings await... or shall begin anew
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Your username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-center text-lg bg-card/50 border-border/50 focus:border-accent"
              autoFocus
              disabled={isLoading}
            />
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!username.trim() || isLoading}
            className="w-full btn-ink text-lg py-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Entering...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Continue
              </>
            )}
          </Button>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-muted-foreground mt-6 text-center italic"
        >
          "The ink remembers those who dare to write."
        </motion.p>
      </div>
    </motion.div>
  );
}
