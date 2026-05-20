import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  useVideoConfig,
} from "remotion";
import { PlayerSelectionOutline, OutlineItem } from "./PlayerSelectionOutline";
import { MediaFile } from "@/types";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  setMediaFiles,
  setActiveElement,
  setActiveElementIndex,
} from "@/store/slices/projectSlice";

const REMOTION_SAFE_FRAME = 0;

interface SequenceItemOptions {
  handleTextChange?: (id: string, text: string) => void;
  fps: number;
  editableTextId?: string | null;
  currentTime?: number;
}

const calculateFrames = (
  display: { from: number; to: number },
  fps: number,
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

export const VideoSequenceItem: React.FC<VideoSequenceItemProps> = ({
  item,
  options,
}) => {
  const { fps } = options;
  const dispatch = useAppDispatch();
  const { mediaFiles, resolution, activeElement, activeElementIndex } =
    useAppSelector((state) => state.projectState);
  const config = useVideoConfig();

  

  const isSelected =
    activeElement === "media" && mediaFiles[activeElementIndex]?.id === item.id;

  const targetRef = useRef<HTMLDivElement>(null);

  // Scale factor: composition coords -> resolution coords
  // config.width is the composition width (e.g. 1280), resolution.width is 1920
  //const compScale = config.width / resolution.width; // e.g. 1280/1920 = 0.667
  const compScale = 1

  //console.log("compScale", compScale);

  // Positions/sizes in composition space (what Remotion renders in)
  const compX = item.x * compScale;
  const compY = item.y * compScale;
  const compW = (item.width || resolution.width) * compScale;
  const compH = (item.height || resolution.height) * compScale;

  const handleUpdate = useCallback(
    (id: string, updates: Partial<OutlineItem>) => {
      const updated = mediaFiles.map((f) =>
        f.id === id ? { ...f, ...updates } : f,
      );
      dispatch(setMediaFiles(updated));
    },
    [mediaFiles, dispatch],
  );

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setActiveElement("media"));
    dispatch(
      setActiveElementIndex(mediaFiles.findIndex((f) => f.id === item.id)),
    );
  };

  const playbackRate = item.playbackSpeed || 1;

  const { from, durationInFrames } = calculateFrames(
    {
      from: item.positionStart,
      to: item.positionEnd,
    },
    fps,
  );

  const trim = {
    from: item.startTime / playbackRate,
    to: item.endTime / playbackRate,
  };

  const videoStyle = useMemo<React.CSSProperties>(
    () => ({
      pointerEvents: "auto",
      position: "absolute",
      top: `${compY}px`,
      left: `${compX}px`,
      width: `${compW}px`,
      height: `${compH}px`,
      transform: "none",
      zIndex: item.zIndex,
      opacity: item?.opacity !== undefined ? item.opacity / 100 : 1,
      borderRadius: `10px`,
      overflow: "hidden",
    }),
    [compX, compY, compW, compH, item.zIndex, item.opacity],
  );

  return (
    <Sequence
      key={item.id}
      from={from}
      durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
      style={{ pointerEvents: "none" }}>
      {/* Use a wrapper AbsoluteFill just to provide pointer-events, the actual positioned div is inside */}
      <AbsoluteFill style={{ pointerEvents: "none", position: "relative" }}>
        <div
          ref={targetRef}
          data-track-item="transition-element"
          className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
          onMouseDown={onMouseDown}
          style={videoStyle}>
          <OffthreadVideo
            startFrom={trim.from * fps}
            endAt={trim.to * fps + REMOTION_SAFE_FRAME}
            playbackRate={playbackRate}
            src={item.src || ""}
            volume={item.volume !== undefined ? item.volume / 100 : 1}
            style={{
              pointerEvents: "none",
              width: "100%",
              height: "100%",
              objectFit: "fill",
            }}
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
