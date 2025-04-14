import { CheckCircle, BarChart2, Bell, LucideIcon } from "lucide-react";

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
    iconBgClass: "bg-purple-600/20 text-purple-400",
  },
  {
    title: "Spending Overview",
    description: "Visualize your monthly and yearly subscription costs. Understand where your money goes.",
    icon: BarChart2,
    iconBgClass: "bg-blue-600/20 text-blue-400",
  },
  {
    title: "Renewal Reminders",
    description: "Get optional alerts before subscriptions renew, so you can decide whether to keep or cancel.",
    icon: Bell,
    iconBgClass: "bg-teal-600/20 text-teal-400",
  },
];

// Define the FeatureCard component
function FeatureCard({ feature }: { feature: FeatureInfo }) {
  const Icon = feature.icon;
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${feature.iconBgClass} mb-4`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
      <p className="text-gray-400 text-sm">{feature.description}</p>
    </div>
  );
}

// Define the LandingFeatures component
export function LandingFeatures() {
  return (
    <section id="features" className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-gray-900/50 rounded-t-xl">
      <h2 className="text-3xl font-bold text-center text-white mb-12">Why Choose Subly?</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  );
} 