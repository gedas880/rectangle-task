import React, { useState, useEffect, useCallback, useRef } from 'react';
import './RectangleDrawer.css';

const API_BASE_URL = 'http://localhost:5183/api/rectangle';

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
    const [error, setError] = useState('');
    const [pendingApiCall, setPendingApiCall] = useState(false);
    const lastSentRect = useRef(null);
    const pendingUpdateTimeout = useRef(null);

    useEffect(() => {
        const fetchSizeLocation = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/size-location`);
                if (!response.ok) throw new Error('Failed to fetch initial size');
                const data = await response.json();
                setRect(data);
                lastSentRect.current = data;
                setError('');
            } catch (err) {
                setError('Failed to load initial size');
            }
        };
        fetchSizeLocation();
    }, []);

    const sanitizeRect = (rect) => {
        return {
            x: Math.max(0, Math.round(rect.x)),
            y: Math.max(0, Math.round(rect.y)),
            width: Math.max(10, Math.round(rect.width)),
            height: Math.max(10, Math.round(rect.height))
        };
    };

    const updateSizeLocation = useCallback(async (newRect) => {
        if (pendingApiCall) {
            if (pendingUpdateTimeout.current) {
                clearTimeout(pendingUpdateTimeout.current);
            }
            pendingUpdateTimeout.current = setTimeout(() => {
                updateSizeLocation(newRect);
            }, 500);
            return;
        }

        const sanitizedRect = sanitizeRect(newRect);

        if (lastSentRect.current &&
            lastSentRect.current.x === sanitizedRect.x &&
            lastSentRect.current.y === sanitizedRect.y &&
            lastSentRect.current.width === sanitizedRect.width &&
            lastSentRect.current.height === sanitizedRect.height) {
            return;
        }

        setPendingApiCall(true);
        try {
            const response = await fetch(`${API_BASE_URL}/size-location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sanitizedRect),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.title || 'Failed to update rectangle');
            }
            setError('');
            lastSentRect.current = sanitizedRect;
        } catch (err) {
            setError(err.message);
        } finally {
            setPendingApiCall(false);
            if (pendingUpdateTimeout.current) {
                clearTimeout(pendingUpdateTimeout.current);
                pendingUpdateTimeout.current = null;
                if (rect !== lastSentRect.current) {
                    updateSizeLocation(rect);
                }
            }
        }
    }, [pendingApiCall, rect]);

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
                    newRect.x = Math.max(0, Math.min(svgP.x, rect.x + rect.width - minSize));
                    newRect.width = newWidth;
                    newRect.height = Math.max(minSize, svgP.y - rect.y);
                    break;
                }
                case 'w': {
                    const newWidth = Math.max(minSize, (rect.x + rect.width) - svgP.x);
                    newRect.x = Math.max(0, Math.min(svgP.x, rect.x + rect.width - minSize));
                    newRect.width = newWidth;
                    break;
                }
                case 'nw': {
                    const newWidth = Math.max(minSize, (rect.x + rect.width) - svgP.x);
                    const newHeight = Math.max(minSize, (rect.y + rect.height) - svgP.y);
                    newRect.x = Math.max(0, Math.min(svgP.x, rect.x + rect.width - minSize));
                    newRect.y = Math.max(0, Math.min(svgP.y, rect.y + rect.height - minSize));
                    newRect.width = newWidth;
                    newRect.height = newHeight;
                    break;
                }
                case 'n': {
                    const newHeight = Math.max(minSize, (rect.y + rect.height) - svgP.y);
                    newRect.y = Math.max(0, Math.min(svgP.y, rect.y + rect.height - minSize));
                    newRect.height = newHeight;
                    break;
                }
                case 'ne': {
                    newRect.width = Math.max(minSize, svgP.x - rect.x);
                    const newHeight = Math.max(minSize, (rect.y + rect.height) - svgP.y);
                    newRect.y = Math.max(0, Math.min(svgP.y, rect.y + rect.height - minSize));
                    newRect.height = newHeight;
                    break;
                }
            }

            setRect(newRect);
        } else if (isDragging) {
            setRect(prev => ({
                ...prev,
                x: Math.max(0, svgP.x - dragStart.x),
                y: Math.max(0, svgP.y - dragStart.y)
            }));
        }
    };

    const handleMouseUp = () => {
        if (isDragging || isResizing) {
            updateSizeLocation(rect);
        }
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
            <h2>Rectangle Drawing {pendingApiCall && '(Saving...)'}</h2>

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
                    stroke={error ? "red" : "blue"}
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
                {pendingApiCall && <span className="saving-indicator"> (Saving...)</span>}
            </div>
            {error && (
                <div className="error-message">
                    Error: {error}
                </div>
            )}
        </div>
    );
};

export default RectangleDrawer;