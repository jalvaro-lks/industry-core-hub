// Small helper to scroll to an element, respect reduced-motion, optionally focus it,
// and add a temporary highlight class.
export type ScrollOptions = {
  element?: HTMLElement | null;
  selector?: string;
  container?: HTMLElement | null;
  focus?: boolean;
  highlightClass?: string;
  durationMs?: number;
  block?: 'center' | 'start' | 'nearest';
};

export function scrollToElement(options: ScrollOptions) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { cleanup: () => {} };
  }

  const {
    element = null,
    selector,
    container = null,
    focus = false,
    highlightClass = 'field-nav-highlight',
    durationMs = 2000,
    block = 'center'
  } = options || {};

  let target: HTMLElement | null = element || null;
  if (!target && selector) {
    try {
      target = document.querySelector(selector) as HTMLElement | null;
    } catch (err) {
      target = null;
    }
  }

  if (!target) return { cleanup: () => {} };

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll behavior: prefer built-in scrollIntoView when possible
  try {
    if (container && container instanceof HTMLElement) {
      // compute target position relative to container
      const elRect = target.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      const offset = elRect.top - contRect.top;
      const top = container.scrollTop + offset - (contRect.height / 2) + (elRect.height / 2);
      if (prefersReduced) {
        container.scrollTop = top;
      } else {
        container.scrollTo({ top, behavior: 'smooth' });
      }
    } else if (!prefersReduced && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block });
    } else if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block });
    }
  } catch (err) {
    // ignore
  }

  // Optionally focus the element if it's focusable
  if (focus) {
    try {
      // Only focus interactive elements
      const focusable = (target.tabIndex >= 0) || ['INPUT','SELECT','TEXTAREA','BUTTON','A'].includes(target.tagName);
      if (focusable) {
        (target as HTMLElement).focus({ preventScroll: true } as any);
      }
    } catch (err) {
      // ignore
    }
  }

  // After container-level scroll, ensure the element is visible in the viewport.
  try {
    const rect = target.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
    if (!isVisible) {
      if (!prefersReduced && typeof target.scrollIntoView === 'function') {
        // small delay so container scroll finishes first
        setTimeout(() => {
          try { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
        }, 120);
      } else if (typeof target.scrollIntoView === 'function') {
        try { target.scrollIntoView({ block: 'center' }); } catch (e) {}
      }
    }
  } catch (err) {
    // ignore
  }

  // Add highlight class temporarily
  let removed = false;
  if (highlightClass) {
    // Prefer to highlight an inner value container (input/select/mui input root) instead of the full field wrapper
    const selectors = [
      '.MuiOutlinedInput-root',
      '.MuiInputBase-root',
      'input',
      'textarea',
      'select',
      '.MuiSwitch-root',
      '.MuiSelect-root'
    ];
    let highlightTarget: HTMLElement | null = null;
    for (const s of selectors) {
      const found = target.querySelector(s) as HTMLElement | null;
      if (found) { highlightTarget = found; break; }
    }
    if (!highlightTarget) highlightTarget = target;

    const animClass = 'field-nav-animatable';
    const hoverClass = 'field-nav-hover';
    // Ensure the element has the animatable class so transitions run both on add and remove
    highlightTarget.classList.add(animClass);
    highlightTarget.classList.add(highlightClass);

    // Also add the hover-like class to the nearest input/select root so the outline matches hover
    let hoverTarget: HTMLElement | null = null;
    try {
      hoverTarget = (highlightTarget.closest && (highlightTarget.closest('.MuiOutlinedInput-root, .MuiInputBase-root, .MuiSelect-root') as HTMLElement)) || null;
    } catch (err) {
      hoverTarget = null;
    }
    if (!hoverTarget) hoverTarget = highlightTarget;
    hoverTarget.classList.add(hoverClass);

    const t = setTimeout(() => {
      // Remove the highlight class first so the element transitions back
      highlightTarget && highlightTarget.classList.remove(highlightClass);
      // Remove hover class to restore outline
      hoverTarget && hoverTarget.classList.remove(hoverClass);
      removed = true;
      // After transition completes, remove the animatable class as cleanup
      const TRANS_MS = 700; // should match CSS transition duration (ms)
      setTimeout(() => {
        highlightTarget && highlightTarget.classList.remove(animClass);
      }, TRANS_MS);
    }, durationMs);

    return {
      cleanup: () => {
        if (!removed) {
          clearTimeout(t);
          highlightTarget && highlightTarget.classList.remove(highlightClass);
          // also remove hover and animatable
          highlightTarget && highlightTarget.classList.remove('field-nav-hover');
          highlightTarget && highlightTarget.classList.remove('field-nav-animatable');
        }
      }
    };
  }

  return { cleanup: () => {} };
}
