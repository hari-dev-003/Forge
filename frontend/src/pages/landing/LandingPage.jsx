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
import LandingFooter from './LandingFooter.jsx';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function LandingPage() {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      // Hero entrance — headline column and floating card reveal as a clear
      // sequence (fade + slight rise + scale) rather than one flat block.
      gsap.from('[data-hero-in]', {
        opacity: 0,
        y: 28,
        scale: 0.97,
        duration: 0.7,
        stagger: 0.18,
        ease: 'power2.out',
      });

      // Hero/portfolio-card figures count up from 0 once on load — reads the
      // target/format off data attributes so any number, anywhere, can opt in
      // just by rendering the right data-* props (see Hero.jsx).
      gsap.utils.toArray('[data-count-to]').forEach((el) => {
        const target = parseFloat(el.dataset.countTo);
        const decimals = Number(el.dataset.decimals || 0);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const thousands = el.dataset.thousands === 'true';
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.4,
          delay: 0.5,
          ease: 'power2.out',
          onUpdate: () => {
            const num = thousands
              ? obj.val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
              : obj.val.toFixed(decimals);
            el.textContent = `${prefix}${num}${suffix}`;
          },
        });
      });

      // Ambient background blobs drift with scroll position instead of on a
      // disconnected timer — background layers move slower than foreground
      // ones so the page reads as having real depth as you scroll past it.
      gsap.utils.toArray('[data-parallax]').forEach((layer, i) => {
        gsap.to(layer, {
          yPercent: (i % 2 === 0 ? 1 : -1) * (10 + i * 4),
          ease: 'none',
          scrollTrigger: {
            trigger: layer.closest('section'),
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6,
          },
        });
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
      <LandingFooter />
    </div>
  );
}
