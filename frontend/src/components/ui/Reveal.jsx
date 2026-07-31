import { useEffect, useRef, useState } from 'react';

/**
 * Named stagger steps for <Reveal delay={...}>, so pages compose waves of
 * content revealing in a consistent rhythm instead of hand-typing ms values.
 * Each step is one "wave" — most sections only need STAGGER[1].
 */
export const STAGGER = { 1: 80, 2: 160, 3: 240, 4: 320 };

/**
 * Lightweight scroll-in reveal for the authenticated app — plain
 * IntersectionObserver + CSS (see .reveal in index.css), no animation
 * library.
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...props }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      data-visible={visible}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}
