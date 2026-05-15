import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

type DocumentPiP = {
  requestWindow: (opts?: { width?: number; height?: number }) => Promise<Window>;
};

type PiPNavigator = typeof window & { documentPictureInPicture?: DocumentPiP };

export function isPiPSupported(): boolean {
  return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
}

export function usePiP() {
  const [open, setOpen] = useState(false);
  const winRef = useRef<Window | null>(null);
  const rootRef = useRef<Root | null>(null);
  const lastNodeRef = useRef<React.ReactNode>(null);

  // Re-render whatever was last passed when PiP is open
  const render = useCallback((node: React.ReactNode) => {
    lastNodeRef.current = node;
    if (rootRef.current) {
      rootRef.current.render(node);
    }
  }, []);

  const close = useCallback(() => {
    winRef.current?.close();
  }, []);

  const openPiP = useCallback(async (width = 280, height = 392) => {
    const pip = (window as PiPNavigator).documentPictureInPicture;
    if (!pip) return false;

    try {
      const win = await pip.requestWindow({ width, height });
      winRef.current = win;

      // Copy all <link rel="stylesheet"> + inline <style> to the PiP doc
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => {
        win.document.head.appendChild(el.cloneNode(true));
      });

      // Match body background + font so the PiP looks consistent
      win.document.body.style.margin = '0';
      win.document.body.style.background = '#fdf6e3';
      win.document.body.style.color = '#2b1d10';
      win.document.body.style.fontFamily = 'Nunito, ui-rounded, system-ui, sans-serif';
      win.document.body.style.overflow = 'hidden';
      win.document.body.style.height = '100vh';

      const container = win.document.createElement('div');
      container.id = 'pip-root';
      container.style.height = '100%';
      win.document.body.appendChild(container);

      const root = createRoot(container);
      rootRef.current = root;
      if (lastNodeRef.current) root.render(lastNodeRef.current);

      win.addEventListener('pagehide', () => {
        rootRef.current?.unmount();
        rootRef.current = null;
        winRef.current = null;
        setOpen(false);
      });

      setOpen(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    return () => {
      winRef.current?.close();
    };
  }, []);

  return { open, openPiP, close, render };
}
