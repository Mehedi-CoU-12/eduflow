'use client';

import React from 'react';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './HeroSection';
import { TrustSection } from './TrustSection';
import { FeaturesSection } from './FeaturesSection';
import { RoleExperiencesSection } from './RoleExperiencesSection';
import { ProductShowcaseSection } from './ProductShowcaseSection';
import { HowItWorksSection } from './HowItWorksSection';
import { SecuritySection } from './SecuritySection';
import { CtaSection } from './CtaSection';
import { LandingFooter } from './LandingFooter';

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Section A: Navigation */}
      <LandingNavbar />

      <main className="flex-1">
        {/* Section B: Hero Section */}
        <HeroSection />

        {/* Section C: Trust / Value Proposition */}
        <TrustSection />

        {/* Section D: Features */}
        <FeaturesSection />

        {/* Section E: Different Experiences for Everyone */}
        <RoleExperiencesSection />

        {/* Section F: Product Preview */}
        <ProductShowcaseSection />

        {/* Section G: How It Works */}
        <HowItWorksSection />

        {/* Section H: Security and Reliability */}
        <SecuritySection />

        {/* Section I: Final CTA */}
        <CtaSection />
      </main>

      {/* Section J: Footer */}
      <LandingFooter />
    </div>
  );
}
