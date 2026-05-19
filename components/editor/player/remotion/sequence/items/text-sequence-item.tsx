import { TextElement } from "@/types";
import { useAppDispatch, useAppSelector } from "@/store";
import { setTextElements, setActiveElement, setActiveElementIndex } from "@/store/slices/projectSlice";
import { Sequence, useVideoConfig } from "remotion";
import React, { useEffect, useRef } from "react";
import Moveable from "react-moveable";
import "./moveable.css";

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
    const { fps } = options;
    const dispatch = useAppDispatch();
    const { textElements, resolution, activeElement, activeElementIndex } = useAppSelector((state) => state.projectState);
    const config = useVideoConfig();

    const isSelected = activeElement === 'text' && textElements[activeElementIndex]?.id === item.id;

    const targetRef = useRef<HTMLDivElement>(null);
    const localPosRef = useRef({ x: item.x, y: item.y });
    const sizeRef = useRef({ width: item.width || undefined, height: item.height || undefined });

    useEffect(() => {
        localPosRef.current = { x: item.x, y: item.y };
        sizeRef.current = { width: item.width, height: item.height };
    }, [item.x, item.y, item.width, item.height]);

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

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(setActiveElement("text"));
        dispatch(setActiveElementIndex(textElements.findIndex(t => t.id === item.id)));
    };

    return (
        <Sequence
            key={item.id}
            from={from}
            durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
            style={{ pointerEvents: "none" }}
        >
            <div
                ref={targetRef}
                className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-text`}
                data-track-item="transition-element"
                style={{
                    position: "absolute",
                    width: item.width || "max-content",
                    height: item.height || "auto",
                    fontSize: item.fontSize || "16px",
                    top: item.y,
                    left: item.x,
                    color: item.color || "#000000",
                    zIndex: 1000,
                    opacity: item.opacity! / 100,
                    fontFamily: item.font || "Arial",
                    pointerEvents: "auto",
                }}
            >
                <div
                    data-text-id={item.id}
                    style={{
                        height: "auto",
                        boxShadow: "none",
                        outline: "none",
                        whiteSpace: "normal",
                        backgroundColor: item.backgroundColor || "transparent",
                        position: "relative",
                        width: "100%",
                        cursor: "default",
                    }}
                    onMouseDown={handleMouseDown}
                    dangerouslySetInnerHTML={{ __html: item.text }}
                    className="designcombo_textLayer"
                />
            </div>

            {isSelected && targetRef.current && (
                <Moveable
                    target={targetRef.current}
                    draggable={true}
                    resizable={true}
                    rotatable={false}
                    keepRatio={false}
                    snappable={true}
                    bounds={{ left: 0, top: 0, right: resolution.width, bottom: resolution.height }}
                    zoom={config.height / resolution.height}
                    onDrag={(e) => {
                        e.target.style.left = `${e.left}px`;
                        e.target.style.top = `${e.top}px`;
                        localPosRef.current = { x: e.left, y: e.top };
                    }}
                    onDragEnd={() => {
                        const updated = textElements.map(f =>
                            f.id === item.id ? { ...f, x: localPosRef.current.x, y: localPosRef.current.y } : f
                        );
                        dispatch(setTextElements(updated));
                    }}
                    onResize={(e) => {
                        e.target.style.width = `${e.width}px`;
                        e.target.style.height = `${e.height}px`;
                        e.target.style.left = `${e.drag.left}px`;
                        e.target.style.top = `${e.drag.top}px`;
                        localPosRef.current = { x: e.drag.left, y: e.drag.top };
                        sizeRef.current = { width: e.width, height: e.height };
                    }}
                    onResizeEnd={() => {
                        const updated = textElements.map(f =>
                            f.id === item.id ? {
                                ...f,
                                x: localPosRef.current.x,
                                y: localPosRef.current.y,
                                width: sizeRef.current.width,
                                height: sizeRef.current.height
                            } : f
                        );
                        dispatch(setTextElements(updated));
                    }}
                    controlSize={20}
                    renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
                />
            )}
        </Sequence>
    );
};