import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';

/**
 * Gives the React Flow canvas a definite height.
 *
 * ReactFlow renders at `height: 100%`, but the layout's <main> has no fixed
 * height, so the canvas collapsed and nodes / the test-bot panel spilled out
 * of it. Anything above the canvas (app bar, impersonation banner) varies, so
 * we measure our own top offset and fill the rest of the viewport.
 */
const BOTTOM_GAP = 24; // matches the layout's content padding
const MIN_HEIGHT = 480;

export default function FlowViewport({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(MIN_HEIGHT);

  useLayoutEffect(() => {
    const measure = () => {
      if (!ref.current) return;
      const top = ref.current.getBoundingClientRect().top + window.scrollY;
      setHeight(Math.max(MIN_HEIGHT, window.innerHeight - top - BOTTOM_GAP));
    };
    measure();
    window.addEventListener('resize', measure);

    // The banner mounts after a client-side check, shifting us down.
    const observer = new ResizeObserver(measure);
    if (ref.current?.parentElement) observer.observe(ref.current.parentElement);

    // overflow:hidden still allows programmatic scrolling (scrollIntoView,
    // focus()). If anything scrolls the canvas or this wrapper, snap it back so
    // the flow never shifts out of view. Scroll events don't bubble, so listen
    // in the capture phase and only reset our own containers, not the chat
    // log's scroll box.
    const wrapper = ref.current;
    const pin = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t === wrapper || t?.classList?.contains('react-flow')) {
        t.scrollTop = 0;
        t.scrollLeft = 0;
      }
    };
    wrapper?.addEventListener('scroll', pin, true);

    return () => {
      window.removeEventListener('resize', measure);
      observer.disconnect();
      wrapper?.removeEventListener('scroll', pin, true);
    };
  }, []);

  return (
    <Box
      ref={ref}
      sx={{
        height,
        width: '100%',
        position: 'relative',
        overflow: 'hidden', // keep nodes and the test panel inside the canvas
        borderRadius: '10px',
      }}
    >
      {children}
    </Box>
  );
}
