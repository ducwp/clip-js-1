import React, { useEffect, useRef, useState, useCallback } from "react";
import { AbsoluteFill, Img, Sequence, useVideoConfig } from "remotion";
import { PlayerSelectionOutline, OutlineItem } from "./PlayerSelectionOutline";
import { MediaFile } from "@/types";
import { useAppSelector, useAppDispatch } from "@/store";
import { setMediaFiles, setActiveElement, setActiveElementIndex } from "@/store/slices/projectSlice";

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
    const { mediaFiles, resolution, activeElement, activeElementIndex } = useAppSelector((state) => state.projectState);
    const config = useVideoConfig();
    const [renderKey, setRenderKey] = useState(0);

    const isSelected = activeElement === 'media' && mediaFiles[activeElementIndex]?.id === item.id;

    const targetRef = useRef<HTMLDivElement>(null);
    const compScale = config.width / resolution.width;

    const handleUpdate = useCallback((id: string, updates: Partial<OutlineItem>) => {
        const updated = mediaFiles.map(f =>
            f.id === id ? { ...f, ...updates } : f
        );
        dispatch(setMediaFiles(updated));
    }, [mediaFiles, dispatch]);

    const onMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(setActiveElement("media"));
        dispatch(setActiveElementIndex(mediaFiles.findIndex(f => f.id === item.id)));
    };

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
            key={`${item.id}-${renderKey}`}
            from={from}
            durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
            style={{ pointerEvents: "none" }}
        >
            <AbsoluteFill style={{ pointerEvents: "none", position: "relative" }}>
                <div
                    ref={targetRef}
                    data-track-item="transition-element"
                    className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
                    onMouseDown={onMouseDown}
                    style={{
                        pointerEvents: "auto",
                        position: "absolute",
                        top: `${item.y * compScale}px`,
                        left: `${item.x * compScale}px`,
                        width: `${(item.width || resolution.width) * compScale}px`,
                        height: `${(item.height || resolution.height) * compScale}px`,
                        opacity: item?.opacity !== undefined ? item.opacity / 100 : 1,
                        overflow: "hidden",
                        transform: "none",
                        zIndex: item.zIndex,
                    }}
                >
                    <Img
                        style={{
                            pointerEvents: "none",
                            width: "100%",
                            height: "100%",
                            position: "absolute",
                            objectFit: "fill",
                            zIndex: item.zIndex || 0,
                        }}
                        data-id={item.id}
                        src={item.src || ""}
                    />
                </div>
            </AbsoluteFill>

            {isSelected && (
                <PlayerSelectionOutline
                    item={{
                        id: item.id,
                        x: item.x,
                        y: item.y,
                        width: item.width || resolution.width,
                        height: item.height || resolution.height,
                    }}
                    onUpdate={handleUpdate}
                    compScale={compScale}
                    targetRef={targetRef}
                />
            )}
        </Sequence>
    );
};
