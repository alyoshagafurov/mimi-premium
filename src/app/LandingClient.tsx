'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { TopNav } from '@/components/ui/TopNav';
import { Footer } from '@/components/ui/Footer';
import { VideoHero } from '@/components/landing/VideoHero';
import { StorytellingScroll } from '@/components/landing/StorytellingScroll';
import { TrustSection } from '@/components/landing/TrustSection';
import { ChannelsSection } from '@/components/landing/ChannelsSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { CasesSection } from '@/components/landing/CasesSection';
import { ProcessSection } from '@/components/landing/ProcessSection';
import { PricingTeaser } from '@/components/landing/PricingTeaser';
import { GuaranteesSection } from '@/components/landing/GuaranteesSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FinalCTA } from '@/components/landing/FinalCTA';

/**
 * mimi landing — every section has its own scroll signature.
 *
 *   Hero        mouse-reactive aurora + monogram tilt
 *   Storytelling   GSAP pin + morphing SVG composition
 *   Trust          animated count-up on viewport enter
 *   Channels       infinite horizontal marquee (CSS)
 *   Services       row reveal + hover x-shift
 *   About          word-by-word scroll reveal
 *   Cases          SVG growth line that draws on scroll
 *   Process        vertical lime line fills as scroll passes each step
 *   Pricing        3D card tilt + cursor spotlight
 *   FAQ            accordion
 *   Final CTA      form + headline reveal
 */
export function LandingClient() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    document.fonts?.ready?.then(() => ScrollTrigger.refresh());
  }, []);

  return (
    <div className="relative">
      <TopNav transparent />
      <main>
        <VideoHero />
        <StorytellingScroll />
        <TrustSection />
        <ChannelsSection />
        <ServicesSection />
        <AboutSection />
        <CasesSection />
        <ProcessSection />
        <PricingTeaser />
        <GuaranteesSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
