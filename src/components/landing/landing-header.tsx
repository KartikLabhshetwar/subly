'use client';

import { useState } from 'react';
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";
import { AuthPopover } from '@/components/ui/auth-popover';

export function LandingHeader() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        <div className="flex justify-between items-center">
          {/* Logo/Brand */}
          <motion.div 
            className="flex items-center space-x-3 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <span className="text-2xl font-bold text-foreground">Subly</span>
            </div>
          </motion.div>

          {/* Sign In Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </motion.button>
        </div>
      </motion.header>

      <AuthPopover 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </>
  );
} 