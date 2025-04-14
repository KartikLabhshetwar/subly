'use client';

import { CheckCircle, BarChart2, Bell, LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Define type for a feature
interface FeatureInfo {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBgClass: string; // Tailwind classes for icon background/color
}

// Define the features data
const features: FeatureInfo[] = [
  {
    title: "Automatic Detection",
    description: "Securely connect your email to automatically find recurring subscription payments.",
    icon: CheckCircle,
    iconBgClass: "bg-primary/20 text-primary",
  },
  {
    title: "Spending Overview",
    description: "Visualize your monthly and yearly subscription costs. Understand where your money goes.",
    icon: BarChart2,
    iconBgClass: "bg-primary/20 text-primary",
  },
  {
    title: "Renewal Reminders",
    description: "Get optional alerts before subscriptions renew, so you can decide whether to keep or cancel.",
    icon: Bell,
    iconBgClass: "bg-primary/20 text-primary",
  },
];

// Define the FeatureCard component
function FeatureCard({ feature, index }: { feature: FeatureInfo; index: number }) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="group relative h-full">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Card content */}
        <div className="relative bg-card border hover:border-primary/50 p-8 rounded-lg transition-all duration-300 h-full flex flex-col items-center">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${feature.iconBgClass} mb-6 transition-transform duration-200`}
          >
            <Icon className="h-7 w-7" />
          </motion.div>
          
          <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
            {feature.title}
          </h3>
          
          <p className="text-muted-foreground text-sm leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Define the LandingFeatures component
export function LandingFeatures() {
  return (
    <section 
      id="features" 
      className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative"
      >
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            Why Choose Subly?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Simplify your subscription management with powerful features designed for you.
          </motion.p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </motion.div>
    </section>
  );
} 