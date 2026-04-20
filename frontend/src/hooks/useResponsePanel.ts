import { useState, useCallback, useEffect, useRef } from 'react';

export type ResponsePanelPosition = 'bottom' | 'right';

export function useResponsePanel() {
  const [position, setPosition] = useState<ResponsePanelPosition>(() => {
    return (localStorage.getItem('lumina_response_pos') as ResponsePanelPosition) || 'bottom';
  });
  const [height, setHeight] = useState(() => {
    return Number(localStorage.getItem('lumina_response_height')) || 350;
  });
  const [width, setWidth] = useState(() => {
    return Number(localStorage.getItem('lumina_response_width')) || 500;
  });
  const [isResizing, setIsResizing] = useState(false);

  // Store position in a ref so the mousemove handler always reads the latest value
  const positionRef = useRef(position);
  useEffect(() => { positionRef.current = position; }, [position]);

  useEffect(() => { localStorage.setItem('lumina_response_pos', position); }, [position]);
  useEffect(() => { localStorage.setItem('lumina_response_height', height.toString()); }, [height]);
  useEffect(() => { localStorage.setItem('lumina_response_width', width.toString()); }, [width]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      if (positionRef.current === 'bottom') {
        // Height = distance from mouse to bottom of viewport
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight > 100 && newHeight < window.innerHeight - 200) {
          setHeight(newHeight);
        }
      } else {
        // Width = distance from mouse to right edge of viewport
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 200 && newWidth < window.innerWidth - 300) {
          setWidth(newWidth);
        }
      }
    };

    const onMouseUp = () => setIsResizing(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing]);

  return {
    position,
    setPosition,
    height,
    width,
    isResizing,
    startResizing,
    togglePosition: useCallback(() => {
      setPosition(prev => prev === 'bottom' ? 'right' : 'bottom');
    }, []),
  };
}
