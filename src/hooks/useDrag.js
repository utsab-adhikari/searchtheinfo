// hooks/useDrag.js
import { useState, useEffect } from 'react';

export const useDrag = (canvasRef, elements, setElements, activeElement, setActiveElement) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if clicked on a text element
      for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        
        if (element.type === 'text') {
          const ctx = canvas.getContext('2d');
          ctx.font = `${element.size}px Arial`;
          const width = ctx.measureText(element.content).width;
          
          if (x >= element.x && x <= element.x + width && 
              y >= element.y - element.size && y <= element.y) {
            setActiveElement({ type: 'text', id: element.id });
            setIsDragging(true);
            setDragOffset({
              x: x - element.x,
              y: y - element.y
            });
            return;
          }
        } else if (element.type === 'logo') {
          if (x >= element.x && x <= element.x + 50 && 
              y >= element.y && y <= element.y + 50) {
            setActiveElement({ type: 'logo', id: element.id });
            setIsDragging(true);
            setDragOffset({
              x: x - element.x,
              y: y - element.y
            });
            return;
          }
        }
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging || !activeElement) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setElements(prev => 
        prev.map(el => {
          if (el.id === activeElement.id) {
            return {
              ...el,
              x: x - dragOffset.x,
              y: y - dragOffset.y
            };
          }
          return el;
        })
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, activeElement, dragOffset, elements, setElements, setActiveElement, canvasRef]);
};