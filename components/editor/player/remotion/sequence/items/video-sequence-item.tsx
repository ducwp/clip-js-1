import React, { useState, useEffect, useRef } from "react";
import { AbsoluteFill, OffthreadVideo, Sequence } from "remotion";
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

interface VideoSequenceItemProps {
    item: MediaFile;
    options: SequenceItemOptions;
}

export const VideoSequenceItem: React.FC<VideoSequenceItemProps> = ({ item, options }) => {
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

    const playbackRate = item.playbackSpeed || 1;
    const { from, durationInFrames } = calculateFrames(
        {
            from: item.positionStart,
            to: item.positionEnd
        },
        fps
    );

    // TODO: Add crop
    // const crop = item.crop || {
    //     x: 0,
    //     y: 0,
    //     width: item.width,
    //     height: item.height
    // };

    const trim = {
        from: (item.startTime) / playbackRate,
        to: (item.endTime) / playbackRate
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
                    width: item.width || "100%",
                    height: item.height || "auto",
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transform: "none",
                    zIndex: item.zIndex,
                    opacity:
                        item?.opacity !== undefined
                            ? item.opacity / 100
                            : 1,
                    borderRadius: `10px`, // Default border radius
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
                    <OffthreadVideo
                        startFrom={(trim.from) * fps}
                        endAt={(trim.to) * fps + REMOTION_SAFE_FRAME}
                        playbackRate={playbackRate}
                        src={item.src || ""}
                        volume={item.volume !== undefined ? item.volume / 100 : 1}
                        style={{
                            pointerEvents: "none",
                            top: 0,
                            left: 0,
                            width: item.width || "100%", // Default width
                            height: item.height || "auto", // Default height
                            position: "absolute"
                        }}
                    />
                </div>
            </AbsoluteFill>
        </Sequence>
    );
};
