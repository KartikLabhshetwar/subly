'use client';

import { useState } from 'react';
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { AuthPopover } from '@/components/ui/auth-popover';
import { VideoShowcase } from '@/components/ui/video-showcase';

export function LandingHero() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />
        
        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            <span className="inline-block">Manage Your</span>{" "}
            <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Subscriptions
            </span>{" "}
            <br className="hidden md:block" />
            <span className="inline-block">Effortlessly.</span>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Stop wasting money on forgotten subscriptions. Subly automatically finds, tracks, and helps you manage them all in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
          >
            <motion.button
              onClick={() => setIsAuthOpen(true)}
              className="relative overflow-hidden rounded-lg px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full sm:w-auto text-lg font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started
            </motion.button>
            <motion.a 
              href="#features" 
              className="group relative overflow-hidden border rounded-lg py-3 px-8 text-lg text-foreground hover:text-primary transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="absolute inset-0 bg-primary/5 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
              <span className="relative">Learn More</span>
              <ArrowDown className="w-4 h-4 group-hover:animate-bounce" />
            </motion.a>
          </motion.div>
        </motion.div>
        
        {/* Video showcase */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 max-w-3xl mx-auto"
        >
          <VideoShowcase
            videoUrl="/demo.mp4"
            title="See how it works"
            description="Watch how Subly helps you manage your subscriptions"
            poster="/demo-poster.jpg"
            className="shadow-2xl"
          />
        </motion.div>
      </section>

      <AuthPopover 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </>
  );
}