import { useState, useEffect, useRef } from 'react';

// This hook detects scroll direction on the window.
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolled down and past a certain threshold
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolled up
        setScrollDirection('up');
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollDirection;
}
