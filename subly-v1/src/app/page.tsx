import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 flex flex-col">
      <LandingHeader />
      
      <main className="flex-grow flex flex-col justify-center">
        <LandingHero />
        <LandingFeatures />
      </main>
      
      <LandingFooter />
    </div>
  );
}
