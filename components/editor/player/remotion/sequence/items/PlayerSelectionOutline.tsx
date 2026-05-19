import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useCurrentScale } from 'remotion';

const HANDLE_SIZE = 12;

interface ResizeHandleProps {
    type: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    onResizeStart: (e: React.PointerEvent, type: string) => void;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ type, onResizeStart }) => {
    const scale = useCurrentScale();
    const size = Math.round(HANDLE_SIZE / scale);
    const borderSize = 2 / scale;

    const sizeStyle: React.CSSProperties = useMemo(() => {
        return {
            position: 'absolute',
            height: size,
            width: size,
            backgroundColor: 'white',
            border: `${borderSize}px solid #0B84F3`,
            borderRadius: '50%',
            zIndex: 10,
        };
    }, [borderSize, size]);

    const margin = -size / 2;

    const style: React.CSSProperties = useMemo(() => {
        if (type === 'top-left') {
            return { ...sizeStyle, marginLeft: margin, marginTop: margin, left: 0, top: 0, cursor: 'nwse-resize' };
        }
        if (type === 'top-right') {
            return { ...sizeStyle, marginTop: margin, marginRight: margin, right: 0, top: 0, cursor: 'nesw-resize' };
        }
        if (type === 'bottom-left') {
            return { ...sizeStyle, marginBottom: margin, marginLeft: margin, left: 0, bottom: 0, cursor: 'nesw-resize' };
        }
        if (type === 'bottom-right') {
            return { ...sizeStyle, marginBottom: margin, marginRight: margin, right: 0, bottom: 0, cursor: 'nwse-resize' };
        }
        return sizeStyle;
    }, [margin, sizeStyle, type]);

    return (
        <div
            onPointerDown={(e) => onResizeStart(e, type)}
            style={style}
        />
    );
};

export interface OutlineItem {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface PlayerSelectionOutlineProps {
    item: OutlineItem;
    onUpdate: (id: string, updates: Partial<OutlineItem>) => void;
    compScale: number; 
    targetRef: React.RefObject<HTMLElement>;
}

export const PlayerSelectionOutline: React.FC<PlayerSelectionOutlineProps> = ({ item, onUpdate, compScale, targetRef }) => {
    // Keep useCurrentScale for initial rendering of borders/handles
    const remotionScale = useCurrentScale();
    const scaledBorder = Math.max(1, Math.ceil(2 / remotionScale));

    const outlineRef = useRef<HTMLDivElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Positions in composition space
    const compLeft = item.x * compScale;
    const compTop = item.y * compScale;
    const compWidth = item.width * compScale;
    const compHeight = item.height * compScale;

    const style: React.CSSProperties = useMemo(() => {
        return {
            width: compWidth,
            height: compHeight,
            left: compLeft,
            top: compTop,
            position: 'absolute',
            outline: `${scaledBorder}px solid #0B84F3`,
            userSelect: 'none',
            touchAction: 'none',
            zIndex: 9999,
            cursor: 'move',
            pointerEvents: 'auto',
        };
    }, [compWidth, compHeight, compLeft, compTop, scaledBorder]);

    const startDragging = useCallback(
        (e: React.PointerEvent) => {
            if (e.button !== 0) return;
            const initialX = e.clientX;
            const initialY = e.clientY;
            
            // Calculate actual visual scale using getBoundingClientRect
            let currentDragScale = remotionScale;
            if (outlineRef.current) {
                const rect = outlineRef.current.getBoundingClientRect();
                // compWidth is item.width * compScale
                const compWidth = item.width * compScale;
                if (compWidth > 0) {
                    currentDragScale = rect.width / compWidth;
                }
            }

            const initialItemLeft = item.x;
            const initialItemTop = item.y;

            setIsDragging(true);

            let finalResX = initialItemLeft;
            let finalResY = initialItemTop;

            const onPointerMove = (pointerMoveEvent: PointerEvent) => {
                const deltaX = pointerMoveEvent.clientX - initialX;
                const deltaY = pointerMoveEvent.clientY - initialY;
                
                const compDeltaX = deltaX / currentDragScale;
                const compDeltaY = deltaY / currentDragScale;
                
                const resDeltaX = compDeltaX / compScale;
                const resDeltaY = compDeltaY / compScale;

                finalResX = initialItemLeft + resDeltaX;
                finalResY = initialItemTop + resDeltaY;

                const newCompLeft = finalResX * compScale;
                const newCompTop = finalResY * compScale;

                // Fast DOM update for the outline
                if (outlineRef.current) {
                    outlineRef.current.style.left = `${newCompLeft}px`;
                    outlineRef.current.style.top = `${newCompTop}px`;
                }

                // Fast DOM update for the video/image element
                if (targetRef.current) {
                    targetRef.current.style.left = `${newCompLeft}px`;
                    targetRef.current.style.top = `${newCompTop}px`;
                }
            };

            const onPointerUp = () => {
                setIsDragging(false);
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
                
                // Commit to Redux at the end
                onUpdate(item.id, {
                    x: Math.round(finalResX),
                    y: Math.round(finalResY),
                });
            };

            window.addEventListener('pointermove', onPointerMove, { passive: true });
            window.addEventListener('pointerup', onPointerUp, { once: true });
        },
        [item, remotionScale, compScale, onUpdate, targetRef]
    );

    const startResizing = useCallback(
        (e: React.PointerEvent, type: string) => {
            e.stopPropagation(); 
            const initialX = e.clientX;
            const initialY = e.clientY;

            let currentDragScale = remotionScale;
            if (outlineRef.current) {
                const rect = outlineRef.current.getBoundingClientRect();
                const compWidth = item.width * compScale;
                if (compWidth > 0) {
                    currentDragScale = rect.width / compWidth;
                }
            }

            const initialItemLeft = item.x;
            const initialItemTop = item.y;
            const initialItemWidth = item.width;
            const initialItemHeight = item.height;

            setIsResizing(true);

            let finalWidth = initialItemWidth;
            let finalHeight = initialItemHeight;
            let finalX = initialItemLeft;
            let finalY = initialItemTop;

            const onPointerMove = (pointerMoveEvent: PointerEvent) => {
                const deltaX = pointerMoveEvent.clientX - initialX;
                const deltaY = pointerMoveEvent.clientY - initialY;

                const compDeltaX = deltaX / currentDragScale;
                const compDeltaY = deltaY / currentDragScale;

                const resDeltaX = compDeltaX / compScale;
                const resDeltaY = compDeltaY / compScale;

                const isLeft = type === 'top-left' || type === 'bottom-left';
                const isTop = type === 'top-left' || type === 'top-right';

                let rawWidth = initialItemWidth + (isLeft ? -resDeltaX : resDeltaX);
                let rawHeight = initialItemHeight + (isTop ? -resDeltaY : resDeltaY);

                if (pointerMoveEvent.shiftKey) {
                    const aspectRatio = initialItemWidth / initialItemHeight;
                    const deltaW = Math.abs(rawWidth - initialItemWidth);
                    const deltaH = Math.abs(rawHeight - initialItemHeight);
                    
                    if (deltaW > deltaH) {
                        rawHeight = rawWidth / aspectRatio;
                    } else {
                        rawWidth = rawHeight * aspectRatio;
                    }
                }

                finalWidth = Math.max(10, rawWidth);
                finalHeight = Math.max(10, rawHeight);
                
                finalX = initialItemLeft + (isLeft ? initialItemWidth - finalWidth : 0);
                finalY = initialItemTop + (isTop ? initialItemHeight - finalHeight : 0);

                const newCompLeft = finalX * compScale;
                const newCompTop = finalY * compScale;
                const newCompWidth = finalWidth * compScale;
                const newCompHeight = finalHeight * compScale;

                // Fast DOM update
                if (outlineRef.current) {
                    outlineRef.current.style.left = `${newCompLeft}px`;
                    outlineRef.current.style.top = `${newCompTop}px`;
                    outlineRef.current.style.width = `${newCompWidth}px`;
                    outlineRef.current.style.height = `${newCompHeight}px`;
                }

                if (targetRef.current) {
                    targetRef.current.style.left = `${newCompLeft}px`;
                    targetRef.current.style.top = `${newCompTop}px`;
                    targetRef.current.style.width = `${newCompWidth}px`;
                    targetRef.current.style.height = `${newCompHeight}px`;
                }
            };

            const onPointerUp = () => {
                setIsResizing(false);
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);

                // Commit to Redux
                onUpdate(item.id, {
                    width: Math.round(finalWidth),
                    height: Math.round(finalHeight),
                    x: Math.round(finalX),
                    y: Math.round(finalY),
                });
            };

            window.addEventListener('pointermove', onPointerMove, { passive: true });
            window.addEventListener('pointerup', onPointerUp, { once: true });
        },
        [item, remotionScale, compScale, onUpdate, targetRef]
    );

    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            e.stopPropagation();
            if (e.button !== 0) return;
            startDragging(e);
        },
        [startDragging]
    );

    return (
        <div ref={outlineRef} onPointerDown={onPointerDown} style={style}>
            <ResizeHandle onResizeStart={startResizing} type="top-left" />
            <ResizeHandle onResizeStart={startResizing} type="top-right" />
            <ResizeHandle onResizeStart={startResizing} type="bottom-left" />
            <ResizeHandle onResizeStart={startResizing} type="bottom-right" />
        </div>
    );
};
