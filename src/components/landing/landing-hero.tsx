'use client'; // Needs client-side logic for AuthButton

import { AuthButton } from "@/components/auth-button";

// Define a simple type for the example subscription
type ExampleSubscription = {
  name: string;
  price: string;
};

// Define props if you want to customize the example list later
interface LandingHeroProps {
  exampleSubscriptions?: ExampleSubscription[];
  estimatedMonthly?: string;
}

const defaultExampleSubscriptions: ExampleSubscription[] = [
  { name: "Streaming Service", price: "$15.99 / mo" },
  { name: "Music Platform", price: "$10.99 / mo" },
  { name: "Cloud Storage (Yearly)", price: "$99.99 / yr" },
];

const defaultEstimatedMonthly = "$35.31";

export function LandingHero({
  exampleSubscriptions = defaultExampleSubscriptions,
  estimatedMonthly = defaultEstimatedMonthly,
}: LandingHeroProps) {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">
        Manage Your Subscriptions <br className="hidden md:block" /> Effortlessly.
      </h1>
      <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
        Stop wasting money on forgotten subscriptions. Subly automatically finds, tracks, and helps you manage them all in one place.
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <AuthButton 
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg text-lg w-full sm:w-auto"
        />
        <a 
          href="#features" 
          className="border border-gray-700 rounded-lg py-3 px-8 text-lg text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors w-full sm:w-auto"
        >
          Learn More
        </a>
      </div>
      
      {/* Simple Visual Element */}
      <div className="mt-16 max-w-lg mx-auto">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-white">Example Subscriptions</h3>
          <div className="space-y-3">
            {exampleSubscriptions.map((sub, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-200 truncate mr-2">{sub.name}</span>
                <span className="font-medium text-gray-300 flex-shrink-0">{sub.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-baseline">
            <span className="text-sm text-gray-400">Estimated Monthly</span>
            <span className="text-lg font-semibold text-white">{estimatedMonthly}</span>
          </div>
        </div>
      </div>
    </section>
  );
} 