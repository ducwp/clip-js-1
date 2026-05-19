import { TextElement } from "@/types";
import { useAppDispatch, useAppSelector } from "@/store";
import { setTextElements, setActiveElement, setActiveElementIndex } from "@/store/slices/projectSlice";
import { Sequence, useVideoConfig } from "remotion";
import React, { useState, useEffect, useRef } from "react";

const REMOTION_SAFE_FRAME = 0;

interface SequenceItemOptions {
    handleTextChange?: (id: string, text: string) => void;
    fps: number;
    editableTextId?: string | null;
    currentTime?: number;
}

const calculateFrames = (
    display: { from: number; to: number },
    fps: number
) => {
    const from = display.from * fps;
    const to = display.to * fps;
    const durationInFrames = Math.max(1, to - from);
    return { from, durationInFrames };
};

export const TextSequenceItem: React.FC<{ item: TextElement; options: SequenceItemOptions }> = ({ item, options }) => {
    const { handleTextChange, fps, editableTextId } = options;
    const dispatch = useAppDispatch();
    const { textElements, resolution, activeElement, activeElementIndex } = useAppSelector((state) => state.projectState);
    const config = useVideoConfig();

    const isSelected = activeElement === 'text' && textElements[activeElementIndex]?.id === item.id;

    const [localPos, setLocalPos] = useState({ x: item.x, y: item.y });

    useEffect(() => {
        setLocalPos({ x: item.x, y: item.y });
    }, [item.x, item.y]);

    const { from, durationInFrames } = calculateFrames(
        {
            from: item.positionStart,
            to: item.positionEnd
        },
        fps
    );

    const onUpdateText = (id: string, updates: Partial<TextElement>) => {
        dispatch(setTextElements(textElements.map(text =>
            text.id === id ? { ...text, ...updates } : text
        )));
    };

    // TODO: Extract this logic to be reusable for other draggable items
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startElemX = item.x;
        const startElemY = item.y;
        
        dispatch(setActiveElement("text"));
        dispatch(setActiveElementIndex(textElements.findIndex(t => t.id === item.id)));

        const scaleFactor = config.height / resolution.height;

        const handleMouseMove = (e: MouseEvent) => {
            const diffX = (e.clientX - startX) / scaleFactor;
            const diffY = (e.clientY - startY) / scaleFactor;
            
            const newPos = { x: startElemX + diffX, y: startElemY + diffY };
            setLocalPos(newPos);
        };

        const handleMouseUp = (e: MouseEvent) => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            const diffX = (e.clientX - startX) / scaleFactor;
            const diffY = (e.clientY - startY) / scaleFactor;
            
            const newX = startElemX + diffX;
            const newY = startElemY + diffY;

            const SNAP_THRESHOLD = 20 / scaleFactor;
            let snappedX = newX;
            let snappedY = newY;

            // Snap to edges of canvas
            if (Math.abs(newX) < SNAP_THRESHOLD) snappedX = 0;
            if (Math.abs(newX + (item.width || 0) - resolution.width) < SNAP_THRESHOLD) snappedX = resolution.width - (item.width || 0);

            if (Math.abs(newY) < SNAP_THRESHOLD) snappedY = 0;
            if (Math.abs(newY + (item.height || 0) - resolution.height) < SNAP_THRESHOLD) snappedY = resolution.height - (item.height || 0);

            onUpdateText(item.id, { x: snappedX, y: snappedY });
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // TODO: add more options for text
    return (
        <Sequence
            className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-text `}
            key={item.id}
            from={from}
            durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
            data-track-item="transition-element"
            style={{
                position: "absolute",
                width: item.width || 3000,
                height: item.height || 400,
                fontSize: item.fontSize || "16px",
                top: localPos.y,
                left: localPos.x,
                color: item.color || "#000000",
                zIndex: 1000,
                // backgroundColor: item.backgroundColor || "transparent",
                opacity: item.opacity! / 100,
                fontFamily: item.font || "Arial",
            }}
        >
            <div
                data-text-id={item.id}
                style={{
                    height: "100%",
                    boxShadow: "none",
                    outline: "none",
                    whiteSpace: "normal",
                    backgroundColor: item.backgroundColor || "transparent",
                    position: "relative",
                    width: "100%",
                    cursor:"move",
                }}
                onMouseDown={handleMouseDown}
                // onMouseMove={handleMouseMove}
                // onMouseUp={handleMouseUp}
                dangerouslySetInnerHTML={{ __html: item.text }}
                className="designcombo_textLayer"
            />
            {isSelected && (
                <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    border: '3px solid #3b82f6', 
                    pointerEvents: 'none'
                }} />
            )}
        </Sequence>
    );
};