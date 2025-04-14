'use client';

import { motion } from "framer-motion";

export function LandingFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16 text-center"
    >
      <div className="flex flex-col items-center space-y-4">
        
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-sm"
        >
          © {new Date().getFullYear()} Subly. All rights reserved.
        </motion.p>
      </div>
    </motion.footer>
  );
} 