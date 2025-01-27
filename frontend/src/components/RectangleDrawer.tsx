import React, { useState } from 'react';
import './RectangleDrawer.css';

const initialConfig = {
    width: 200,
    height: 150,
    x: 50,
    y: 50
};

const RectangleDrawer = () => {
    const [rect, setRect] = useState(initialConfig);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeHandle, setResizeHandle] = useState(null);

    const handleMouseDown = (e, handle = null) => {
        const svg = e.target.closest('svg');
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        if (handle) {
            setIsResizing(true);
            setResizeHandle(handle);
        } else {
            setIsDragging(true);
        }

        setDragStart({
            x: svgP.x - rect.x,
            y: svgP.y - rect.y,
            width: rect.width,
            height: rect.height
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging && !isResizing) return;

        const svg = e.target.closest('svg');
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        if (isResizing) {
            let newRect = { ...rect };
            const minSize = 10;

            switch (resizeHandle) {
                case 'e':
                    newRect.width = Math.max(minSize, svgP.x - rect.x);
                    break;
                case 'se':
                    newRect.width = Math.max(minSize, svgP.x - rect.x);
                    newRect.height = Math.max(minSize, svgP.y - rect.y);
                    break;
                case 's':
                    newRect.height = Math.max(minSize, svgP.y - rect.y);
                    break;
                case 'sw': {
                    const newWidth = Math.max(minSize, (rect.x + rect.width) - svgP.x);
                    newRect.x = Math.min(svgP.x, rect.x + rect.width - minSize);
                    newRect.width = newWidth;
                    newRect.height = Math.max(minSize, svgP.y - rect.y);
                    break;
                }
                case 'w': {
                    const newWidth = Math.max(minSize, (rect.x + rect.width) - svgP.x);
                    newRect.x = Math.min(svgP.x, rect.x + rect.width - minSize);
                    newRect.width = newWidth;
                    break;
                }
                case 'nw': {
                    const newWidth = Math.max(minSize, (rect.x + rect.width) - svgP.x);
                    const newHeight = Math.max(minSize, (rect.y + rect.height) - svgP.y);
                    newRect.x = Math.min(svgP.x, rect.x + rect.width - minSize);
                    newRect.y = Math.min(svgP.y, rect.y + rect.height - minSize);
                    newRect.width = newWidth;
                    newRect.height = newHeight;
                    break;
                }
                case 'n': {
                    const newHeight = Math.max(minSize, (rect.y + rect.height) - svgP.y);
                    newRect.y = Math.min(svgP.y, rect.y + rect.height - minSize);
                    newRect.height = newHeight;
                    break;
                }
                case 'ne': {
                    newRect.width = Math.max(minSize, svgP.x - rect.x);
                    const newHeight = Math.max(minSize, (rect.y + rect.height) - svgP.y);
                    newRect.y = Math.min(svgP.y, rect.y + rect.height - minSize);
                    newRect.height = newHeight;
                    break;
                }
            }

            setRect(newRect);
        } else if (isDragging) {
            setRect(prev => ({
                ...prev,
                x: svgP.x - dragStart.x,
                y: svgP.y - dragStart.y
            }));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeHandle(null);
    };

    const ResizeHandle = ({ position, cursor }) => {
        const size = 8;
        let x = rect.x;
        let y = rect.y;

        switch (position) {
            case 'e':
                x += rect.width - size/2;
                y += rect.height/2 - size/2;
                break;
            case 'se':
                x += rect.width - size/2;
                y += rect.height - size/2;
                break;
            case 's':
                x += rect.width/2 - size/2;
                y += rect.height - size/2;
                break;
            case 'sw':
                x -= size/2;
                y += rect.height - size/2;
                break;
            case 'w':
                x -= size/2;
                y += rect.height/2 - size/2;
                break;
            case 'nw':
                x -= size/2;
                y -= size/2;
                break;
            case 'n':
                x += rect.width/2 - size/2;
                y -= size/2;
                break;
            case 'ne':
                x += rect.width - size/2;
                y -= size/2;
                break;
        }

        return (
            <rect
                x={x}
                y={y}
                width={size}
                height={size}
                fill="white"
                stroke="blue"
                strokeWidth="1"
                style={{ cursor }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, position);
                }}
            />
        );
    };

    return (
        <div className="rectangle-drawer">
            <h2>Rectangle Drawing Tool By Gediminas</h2>
            <div className="controls">
                <div className="input-group">
                    <label>Width:</label>
                    <input
                        type="number"
                        value={Math.round(rect.width)}
                        onChange={(e) => setRect(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                    />
                </div>
                <div className="input-group">
                    <label>Height:</label>
                    <input
                        type="number"
                        value={Math.round(rect.height)}
                        onChange={(e) => setRect(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                    />
                </div>
            </div>

            <svg
                viewBox="0 0 800 600"
                className="drawing-area"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    fill="none"
                    stroke="blue"
                    strokeWidth="2"
                    style={{ cursor: 'move' }}
                />
                <ResizeHandle position="e" cursor="e-resize" />
                <ResizeHandle position="se" cursor="se-resize" />
                <ResizeHandle position="s" cursor="s-resize" />
                <ResizeHandle position="sw" cursor="sw-resize" />
                <ResizeHandle position="w" cursor="w-resize" />
                <ResizeHandle position="nw" cursor="nw-resize" />
                <ResizeHandle position="n" cursor="n-resize" />
                <ResizeHandle position="ne" cursor="ne-resize" />

                <text
                    x={rect.x + rect.width + 10}
                    y={rect.y + rect.height/2}
                    fill="blue"
                    fontSize="14"
                >
                    Perimeter: {Math.round((rect.width + rect.height) * 2)}
                </text>
            </svg>

            <div className="position">
                Position: ({Math.round(rect.x)}, {Math.round(rect.y)})
            </div>
        </div>
    );
};

export default RectangleDrawer;