'use client';
import { useEffect } from 'react';

// On narrow screens the bar scrolls sideways: open it with the current entry in view.
export function NavScroll() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.site-header .section-nav');
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !current || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollLeft = current.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft - (nav.clientWidth - current.offsetWidth) / 2;
  }, []);
  return null;
}
