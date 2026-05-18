import React, { useState, useEffect, useRef } from "react";
import { AbsoluteFill, Img, Sequence } from "remotion";
import { MediaFile } from "@/types";
import { useAppSelector, useAppDispatch } from "@/store";
import { setMediaFiles } from "@/store/slices/projectSlice";

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

interface ImageSequenceItemProps {
    item: MediaFile;
    options: SequenceItemOptions;
}

export const ImageSequenceItem: React.FC<ImageSequenceItemProps> = ({ item, options }) => {
    const { fps } = options;
    const dispatch = useAppDispatch();
    const mediaFiles = useAppSelector((state) => state.projectState.mediaFiles);

    const [isDragging, setIsDragging] = useState(false);
    const [localPos, setLocalPos] = useState({ x: item.x, y: item.y });
    const startMousePos = useRef({ x: 0, y: 0 });
    const startElementPos = useRef({ x: 0, y: 0 });
    const localPosRef = useRef({ x: item.x, y: item.y });

    useEffect(() => {
        setLocalPos({ x: item.x, y: item.y });
        localPosRef.current = { x: item.x, y: item.y };
    }, [item.x, item.y]);

    const onMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDragging(true);
        startMousePos.current = { x: e.clientX, y: e.clientY };
        startElementPos.current = { x: localPos.x, y: localPos.y };
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startMousePos.current.x;
            const deltaY = e.clientY - startMousePos.current.y;
            const newPos = {
                x: startElementPos.current.x + deltaX,
                y: startElementPos.current.y + deltaY
            };
            setLocalPos(newPos);
            localPosRef.current = newPos;
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            setIsDragging(false);
            
            const updated = mediaFiles.map(f => 
                f.id === item.id ? { ...f, x: localPosRef.current.x, y: localPosRef.current.y } : f
            );
            dispatch(setMediaFiles(updated));
        };

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, dispatch, mediaFiles, item.id]);

    const { from, durationInFrames } = calculateFrames(
        {
            from: item.positionStart,
            to: item.positionEnd
        },
        fps
    );

    const crop = item.crop || {
        x: 0,
        y: 0,
        width: item.width,
        height: item.height
    };

    return (
        <Sequence
            key={item.id}
            from={from}
            durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
            style={{ pointerEvents: "none" }}
        >
            <AbsoluteFill
                data-track-item="transition-element"
                className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
                onMouseDown={onMouseDown}
                style={{
                    pointerEvents: "auto",
                    top: localPos.y,
                    left: localPos.x,
                    width: crop.width || "100%",
                    height: crop.height || "auto",
                    cursor: isDragging ? 'grabbing' : 'grab',
                    // transform: item?.transform || "none",
                    opacity:
                        item?.opacity !== undefined
                            ? item.opacity / 100
                            : 1,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: item.width || "100%",
                        height: item.height || "auto",
                        position: "relative",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <Img
                        style={{
                            pointerEvents: "none",
                            top: -crop.y || 0,
                            left: -crop.x || 0,
                            width: item.width || "100%",
                            height: item.height || "auto",
                            position: "absolute",
                            zIndex: item.zIndex || 0,
                        }}
                        data-id={item.id}
                        src={item.src || ""}
                    />
                </div>
            </AbsoluteFill>
        </Sequence>
    );
};
