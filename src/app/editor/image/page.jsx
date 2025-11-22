// pages/index.js
"use client";
import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

export default function ImageEditor() {
  const [image, setImage] = useState(null);
  const [texts, setTexts] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(24);
  const [activeElement, setActiveElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });
  const [selectedPlatform, setSelectedPlatform] = useState('custom');
  const [editingText, setEditingText] = useState(null);
  
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);

  // Platform presets
  const platformPresets = {
    instagram: { width: 1080, height: 1080, name: 'Instagram Post' },
    instagramStory: { width: 1080, height: 1920, name: 'Instagram Story' },
    facebook: { width: 1200, height: 630, name: 'Facebook Post' },
    twitter: { width: 1200, height: 675, name: 'Twitter Post' },
    tiktok: { width: 1080, height: 1920, name: 'TikTok' },
    custom: { width: 500, height: 500, name: 'Custom' }
  };

  // Color palette for quick selection
  const colorPalette = [
    '#ffffff', '#000000', '#3b82f6', '#ef4444', '#10b981', 
    '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          drawCanvas();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Get mouse position relative to canvas
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Draw everything on canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image if exists
    if (image) {
      // Draw image maintaining aspect ratio and covering the canvas
      const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
      const x = (canvas.width - image.width * scale) / 2;
      const y = (canvas.height - image.height * scale) / 2;
      ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
    }
    
    // Draw fixed SearchTheInfo logo
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SearchThe', 20, 40);
    ctx.fillStyle = '#10b981';
    ctx.fillText('Info', 20 + ctx.measureText('SearchThe').width, 40);
    
    // Draw all text elements
    texts.forEach(text => {
      ctx.font = `bold ${text.size}px Arial`;
      ctx.fillStyle = text.color;
      ctx.fillText(text.content, text.x, text.y);
      
      // Draw selection with colored background
      if (activeElement && activeElement.id === text.id && !editingText) {
        const width = ctx.measureText(text.content).width;
        const selectionColor = text.selectionColor || '#3b82f6';
        
        // Draw selection background
        ctx.fillStyle = selectionColor + '40';
        ctx.fillRect(text.x - 8, text.y - text.size + 2, width + 16, text.size + 8);
        
        // Draw selection border
        ctx.strokeStyle = selectionColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(text.x - 8, text.y - text.size + 2, width + 16, text.size + 8);
      }
    });
  };

  // Add text to canvas
  const addText = () => {
    if (!currentText.trim()) return;
    
    const newText = {
      id: Date.now(),
      content: currentText,
      color: textColor,
      size: textSize,
      x: canvasSize.width / 2 - 50,
      y: canvasSize.height / 2,
      selectionColor: colorPalette[Math.floor(Math.random() * colorPalette.length)]
    };
    
    setTexts([...texts, newText]);
    setCurrentText('');
    setTimeout(drawCanvas, 0);
  };

  // Check if point is inside text
  const isPointInText = (point, text) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    
    const ctx = canvas.getContext('2d');
    ctx.font = `bold ${text.size}px Arial`;
    const width = ctx.measureText(text.content).width;
    
    return point.x >= text.x && 
           point.x <= text.x + width && 
           point.y >= text.y - text.size && 
           point.y <= text.y;
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e) => {
    if (editingText) return;
    
    const mousePos = getMousePos(e);
    
    // Check if clicked on a text element
    for (let i = texts.length - 1; i >= 0; i--) {
      const text = texts[i];
      if (isPointInText(mousePos, text)) {
        setActiveElement({ type: 'text', id: text.id });
        setIsDragging(true);
        setDragOffset({
          x: mousePos.x - text.x,
          y: mousePos.y - text.y
        });
        return;
      }
    }
    
    setActiveElement(null);
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (!isDragging || !activeElement || editingText) return;
    
    const mousePos = getMousePos(e);
    const canvas = canvasRef.current;
    
    setTexts(texts.map(text => {
      if (text.id === activeElement.id) {
        const newX = mousePos.x - dragOffset.x;
        const newY = mousePos.y - dragOffset.y;
        
        // Get text width for boundary checking
        const ctx = canvas.getContext('2d');
        ctx.font = `bold ${text.size}px Arial`;
        const width = ctx.measureText(text.content).width;
        
        return {
          ...text,
          x: Math.max(10, Math.min(newX, canvas.width - width - 10)),
          y: Math.max(text.size + 10, Math.min(newY, canvas.height - 10))
        };
      }
      return text;
    }));
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Double click to edit text
  const handleDoubleClick = (e) => {
    if (editingText) return;
    
    const mousePos = getMousePos(e);
    
    // Check if double clicked on a text element
    for (let i = texts.length - 1; i >= 0; i--) {
      const text = texts[i];
      if (isPointInText(mousePos, text)) {
        setEditingText(text.id);
        setCurrentText(text.content);
        setTextColor(text.color);
        setTextSize(text.size);
        setActiveElement({ type: 'text', id: text.id });
        
        // Focus the text input after a small delay
        setTimeout(() => {
          textInputRef.current?.focus();
          textInputRef.current?.select();
        }, 100);
        return;
      }
    }
  };

  // Update text when editing
  const updateText = () => {
    if (!editingText) return;
    
    setTexts(texts.map(text => {
      if (text.id === editingText) {
        return {
          ...text,
          content: currentText,
          color: textColor,
          size: textSize
        };
      }
      return text;
    }));
    
    setEditingText(null);
    setTimeout(drawCanvas, 0);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingText(null);
    setCurrentText('');
  };

  // Delete active element
  const deleteActiveElement = () => {
    if (!activeElement) return;
    
    setTexts(texts.filter(text => text.id !== activeElement.id));
    setActiveElement(null);
    setEditingText(null);
    setTimeout(drawCanvas, 0);
  };

  // Change platform preset
  const handlePlatformChange = (platform) => {
    setSelectedPlatform(platform);
    const preset = platformPresets[platform];
    setCanvasSize({ width: preset.width, height: preset.height });
  };

  // Save image
  const saveImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `social-media-${selectedPlatform}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Update canvas dimensions
  const updateCanvasSize = (dimension, value) => {
    const newSize = { ...canvasSize, [dimension]: parseInt(value) || 0 };
    setCanvasSize(newSize);
    setSelectedPlatform('custom');
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && activeElement && !editingText) {
        deleteActiveElement();
      }
      if (e.key === 'Escape' && editingText) {
        cancelEdit();
      }
      if (e.key === 'Enter' && editingText) {
        updateText();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeElement, editingText]);

  // Redraw canvas when dependencies change
  useEffect(() => {
    drawCanvas();
  }, [image, texts, activeElement, canvasSize, editingText]);

  // Add event listeners for dragging
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('dblclick', handleDoubleClick);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, activeElement, dragOffset, texts, canvasSize, editingText]);

  const activeText = texts.find(text => text.id === activeElement?.id);

  return (
    <div className="container">
      <Head>
        <title>Social Media Image Editor</title>
        <meta name="description" content="Simple image editor for social media posts" />
      </Head>

      <header className="header">
        <h1>Social Media Image Editor</h1>
        <p>Create stunning images for all platforms</p>
      </header>

      <div className="editor-container">
        <div className="toolbar">
          <div className="tool-section">
            <h3>📁 Upload Image</h3>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="file-input"
            />
            <button 
              className="btn btn-primary"
              onClick={() => fileInputRef.current.click()}
            >
              Upload Image
            </button>
          </div>

          <div className="tool-section">
            <h3>📐 Platform Sizes</h3>
            <div className="platform-grid">
              {Object.entries(platformPresets).map(([key, preset]) => (
                <button
                  key={key}
                  className={`platform-btn ${selectedPlatform === key ? 'active' : ''}`}
                  onClick={() => handlePlatformChange(key)}
                >
                  {preset.name}
                  <span>{preset.width}×{preset.height}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tool-section">
            <h3>{editingText ? '✏️ Edit Text' : '✏️ Add Text'}</h3>
            <div className="text-input-group">
              <input 
                ref={textInputRef}
                type="text" 
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                placeholder="Enter your text here"
                className="text-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !editingText) addText();
                  if (e.key === 'Enter' && editingText) updateText();
                }}
              />
              {editingText && (
                <div className="edit-buttons">
                  <button className="btn btn-sm btn-success" onClick={updateText}>
                    ✓ Save
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={cancelEdit}>
                    ✕ Cancel
                  </button>
                </div>
              )}
            </div>
            
            <div className="color-palette">
              <label>Text Color:</label>
              <div className="color-swatches">
                {colorPalette.map(color => (
                  <button
                    key={color}
                    className={`color-swatch ${textColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setTextColor(color)}
                  />
                ))}
                <input 
                  type="color" 
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="color-picker"
                />
              </div>
            </div>
            
            <div className="size-control">
              <label>Text Size: {textSize}px</label>
              <input 
                type="range" 
                min="16" 
                max="72" 
                value={textSize}
                onChange={(e) => setTextSize(parseInt(e.target.value))}
              />
            </div>
            
            {!editingText && (
              <button className="btn btn-secondary" onClick={addText}>
                Add Text to Canvas
              </button>
            )}
          </div>

          {activeText && (
            <div className="tool-section">
              <h3>🎯 Selected Text</h3>
              <div className="selected-text-info">
                <div className="text-preview" style={{ color: activeText.color, fontSize: '14px' }}>
                  "{activeText.content}"
                </div>
                <div className="text-properties">
                  <span>Color: <span style={{ color: activeText.color }}>●</span></span>
                  <span>Size: {activeText.size}px</span>
                  <span>Position: {Math.round(activeText.x)}, {Math.round(activeText.y)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="tool-section">
            <h3>💾 Actions</h3>
            <button 
              className="btn btn-danger"
              onClick={deleteActiveElement}
              disabled={!activeElement || editingText}
            >
              Delete Selected Text
            </button>
            <button className="btn btn-success" onClick={saveImage}>
              Save Image
            </button>
          </div>

          <div className="tool-section">
            <h3>🎮 Controls</h3>
            <div className="controls-list">
              <div>• <strong>Click</strong>: Select text</div>
              <div>• <strong>Double Click</strong>: Edit text</div>
              <div>• <strong>Drag</strong>: Move text</div>
              <div>• <strong>Delete</strong>: Remove selected</div>
              <div>• <strong>Enter</strong>: Save editing</div>
              <div>• <strong>Escape</strong>: Cancel editing</div>
            </div>
          </div>
        </div>

        <div className="canvas-area">
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="canvas"
              style={{ 
                width: '100%', 
                height: 'auto',
                maxWidth: '500px',
                maxHeight: '500px',
                cursor: isDragging ? 'grabbing' : (editingText ? 'default' : 'grab')
              }}
            />
          </div>
          <div className="canvas-info">
            <span>{canvasSize.width} × {canvasSize.height}</span>
            <span>{platformPresets[selectedPlatform].name}</span>
            {activeElement && <span className="selected-badge">Text Selected</span>}
            {editingText && <span className="editing-badge">Editing Text</span>}
            {isDragging && <span className="dragging-badge">Dragging</span>}
          </div>
          <p className="canvas-hint">
            {editingText 
              ? 'Editing mode: Press Enter to save, Escape to cancel' 
              : 'Click to select • Double-click to edit • Drag to move • Delete to remove'
            }
          </p>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #0f0f0f;
          min-height: 100vh;
          color: #e5e5e5;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px 0;
          border-bottom: 1px solid #333;
        }
        
        h1 {
          color: #3b82f6;
          margin-bottom: 10px;
          font-size: 2.5rem;
        }
        
        .editor-container {
          display: flex;
          flex-wrap: wrap;
          gap: 30px;
          background: #1a1a1a;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          overflow: hidden;
        }
        
        .toolbar {
          flex: 1;
          min-width: 320px;
          padding: 30px;
          background: #262626;
          border-right: 1px solid #333;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .canvas-area {
          flex: 2;
          min-width: 400px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .tool-section {
          margin-bottom: 35px;
          padding-bottom: 25px;
          border-bottom: 1px solid #333;
        }
        
        .tool-section:last-child {
          border-bottom: none;
        }
        
        .tool-section h3 {
          margin-bottom: 20px;
          color: #f8fafc;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .btn {
          display: inline-block;
          padding: 14px 20px;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
          text-align: center;
          width: 100%;
          margin-bottom: 12px;
          font-weight: 600;
        }
        
        .btn-sm {
          padding: 10px 15px;
          width: auto;
          margin: 0 5px;
          font-size: 0.9rem;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }
        
        .btn-primary:hover {
          background: linear-gradient(135deg, #2563eb, #1e40af);
          transform: translateY(-2px);
        }
        
        .btn-secondary {
          background: linear-gradient(135deg, #6b7280, #4b5563);
        }
        
        .btn-secondary:hover {
          background: linear-gradient(135deg, #4b5563, #374151);
          transform: translateY(-2px);
        }
        
        .btn-success {
          background: linear-gradient(135deg, #10b981, #059669);
        }
        
        .btn-success:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-2px);
        }
        
        .btn-danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }
        
        .btn-danger:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          transform: translateY(-2px);
        }
        
        .btn:disabled {
          background: #4b5563;
          cursor: not-allowed;
          transform: none;
        }
        
        .canvas-container {
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 20px;
          border: 3px solid #333;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .canvas {
          display: block;
          background: #1a1a1a;
        }
        
        .platform-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .platform-btn {
          padding: 12px 8px;
          background: #374151;
          border: 2px solid #4b5563;
          border-radius: 8px;
          color: #e5e5e5;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 0.8rem;
        }
        
        .platform-btn:hover {
          border-color: #3b82f6;
          background: #3b82f620;
        }
        
        .platform-btn.active {
          border-color: #10b981;
          background: #10b98120;
          color: #10b981;
        }
        
        .platform-btn span {
          font-size: 0.7rem;
          color: #9ca3af;
          margin-top: 4px;
        }
        
        .text-input-group {
          position: relative;
          margin-bottom: 15px;
        }
        
        .text-input {
          width: 100%;
          padding: 14px;
          border: 1px solid #404040;
          border-radius: 8px;
          background: #1f1f1f;
          color: #e5e5e5;
          font-size: 1rem;
        }
        
        .text-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px #3b82f640;
        }
        
        .edit-buttons {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }
        
        .color-palette {
          margin: 20px 0;
        }
        
        .color-palette label {
          display: block;
          margin-bottom: 10px;
          color: #d1d5db;
          font-size: 0.9rem;
        }
        
        .color-swatches {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        
        .color-swatch {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 2px solid #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .color-swatch:hover {
          transform: scale(1.1);
          border-color: #e5e5e5;
        }
        
        .color-swatch.active {
          border-color: #10b981;
          transform: scale(1.1);
          box-shadow: 0 0 0 2px #10b98140;
        }
        
        .color-picker {
          width: 32px;
          height: 32px;
          border: 2px solid #374151;
          border-radius: 6px;
          cursor: pointer;
          background: #1f1f1f;
        }
        
        .size-control {
          margin: 20px 0;
        }
        
        .size-control label {
          display: block;
          margin-bottom: 8px;
          color: #d1d5db;
          font-size: 0.9rem;
        }
        
        .file-input {
          display: none;
        }
        
        .canvas-hint {
          font-size: 0.9rem;
          color: #9ca3af;
          text-align: center;
          margin-top: 15px;
          line-height: 1.4;
          padding: 0 20px;
        }
        
        .canvas-info {
          display: flex;
          gap: 15px;
          margin-bottom: 10px;
          font-size: 0.9rem;
          color: #d1d5db;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }
        
        .selected-badge {
          background: #3b82f6;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
        }
        
        .editing-badge {
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
        }
        
        .dragging-badge {
          background: #f59e0b;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
        }
        
        .selected-text-info {
          background: #1f1f1f;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        
        .text-preview {
          margin-bottom: 10px;
          font-weight: bold;
        }
        
        .text-properties {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 0.8rem;
          color: #9ca3af;
        }
        
        .controls-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.9rem;
          color: #d1d5db;
        }
        
        .controls-list div {
          padding: 5px 0;
        }
        
        input[type="range"] {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #404040;
          outline: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f1f1f;
        }
        
        @media (max-width: 768px) {
          .editor-container {
            flex-direction: column;
          }
          
          .toolbar {
            border-right: none;
            border-bottom: 1px solid #333;
            max-height: none;
          }
          
          .platform-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}