import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import LandingNav from './LandingNav.jsx';
import Hero from './Hero.jsx';
import LogoMarquee from './LogoMarquee.jsx';
import ValueProps from './ValueProps.jsx';
import FeatureGrid from './FeatureGrid.jsx';
import LiveSection from './LiveSection.jsx';
import HowItWorks from './HowItWorks.jsx';
import Automation from './Automation.jsx';
import Testimonial from './Testimonial.jsx';
import Pricing from './Pricing.jsx';
import Faq from './Faq.jsx';
import LandingFooter from './LandingFooter.jsx';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function LandingPage() {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      // Hero entrance — the two top-level hero columns fade/slide in on load.
      gsap.from('[data-hero-in]', {
        opacity: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power2.out',
      });

      // Every section after the hero reveals its direct children as the
      // viewport reaches it — scoped per-section so ScrollTrigger doesn't
      // rescan the whole page on every scroll.
      gsap.utils.toArray('[data-reveal-section]').forEach((section) => {
        gsap.from(section.children, {
          opacity: 0,
          y: 24,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });
      });
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} className="bg-bg text-ink min-h-screen overflow-x-hidden">
      <LandingNav />
      <Hero />
      <LogoMarquee />
      <div data-reveal-section><ValueProps /></div>
      <div data-reveal-section><FeatureGrid /></div>
      <LiveSection />
      <div data-reveal-section><HowItWorks /></div>
      <Automation />
      <Testimonial />
      <div data-reveal-section><Pricing /></div>
      <Faq />
      <LandingFooter />
    </div>
  );
}
