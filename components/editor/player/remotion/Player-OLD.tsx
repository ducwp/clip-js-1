import { Player, PlayerRef } from "@remotion/player";
import Composition from "./sequence/composition";
import { useAppSelector, useAppDispatch } from "@/store";
import { useRef, useState, useEffect } from "react";
import { setIsPlaying, setCurrentTime, setActiveElement } from "@/store/slices/projectSlice";
import { useDispatch } from "react-redux";

//icons
import { Play, Pause } from "lucide-react";

const fps = 30;

export const PreviewPlayer = () => {
  const duration = useAppSelector((state) => state.projectState.duration);
  const currentTime = useAppSelector((state) => state.projectState.currentTime);
  const isPlaying = useAppSelector((state) => state.projectState.isPlaying);
  const isMuted = useAppSelector((state) => state.projectState.isMuted);
  const resolution = useAppSelector((state) => state.projectState.resolution);
  console.log("Player.tsx - duration:", duration, "fps:", fps);

  // Scale down for preview to improve performance
  const PREVIEW_HEIGHT = 720;
  const previewScale = PREVIEW_HEIGHT / resolution.height;
  const previewWidth = Math.round(resolution.width * previewScale);
  const previewHeight = PREVIEW_HEIGHT;
  const playerRef = useRef<PlayerRef>(null);
  const dispatch = useDispatch();

  // update frame when current time with marker
  useEffect(() => {
    const frame = Math.round(currentTime * fps);
    if (playerRef.current && !isPlaying) {
      playerRef.current.pause();
      playerRef.current.seekTo(frame);
    }
  }, [currentTime, fps]);

  useEffect(() => {
    playerRef?.current?.addEventListener("play", () => {
      dispatch(setIsPlaying(true));
    });
    playerRef?.current?.addEventListener("pause", () => {
      dispatch(setIsPlaying(false));
    });
    return () => {
      playerRef?.current?.removeEventListener("play", () => {
        dispatch(setIsPlaying(true));
      });
      playerRef?.current?.removeEventListener("pause", () => {
        dispatch(setIsPlaying(false));
      });
    };
  }, [playerRef]);

  // to control with keyboard
  useEffect(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.mute();
    } else {
      playerRef.current.unmute();
    }
  }, [isMuted]);

  const [localTime, setLocalTime] = useState(currentTime);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  useEffect(() => {
    if (!isDraggingSlider) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isDraggingSlider]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only deselect if clicking directly on the background, not on items inside
    if (e.target === e.currentTarget) {
      dispatch(setActiveElement(null));
    }
  };

  return (
    <>
      <div
        className="flex-1 w-full flex items-center justify-center overflow-hidden my-4"
        onClick={handleClickOutside}
      >
        <Player
          ref={playerRef}
          component={Composition}
          inputProps={{}}
          durationInFrames={Math.max(
            30,
            Math.floor((isNaN(duration) ? 0 : duration) * fps) + 1,
          )}
          compositionWidth={previewWidth}
          compositionHeight={previewHeight}
          fps={fps}
          style={{ width: "100%", height: "100%"}}
          controls={false}
          clickToPlay={false}
          acknowledgeRemotionLicense={true}
          className="bg-gray-700"
        />
      </div>

      {/* Custom Controls */}
      <div className="w-full h-12 bg-[#1E1D21] flex items-center justify-between px-4 border-t border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              if (isPlaying) {
                playerRef.current?.pause();
              } else {
                playerRef.current?.play();
              }
            }}
            className="text-white hover:text-blue-500 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause /> : <Play />}
          </button>

          <div className="text-white text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Seek Bar */}
        <div className="flex-1 mx-4">
          <input
            type="range"
            min={0}
            max={duration || 30}
            step={0.01}
            value={localTime}
            onMouseDown={() => setIsDraggingSlider(true)}
            onMouseUp={() => {
              setIsDraggingSlider(false);
              dispatch(setCurrentTime(localTime));
            }}
            onTouchStart={() => setIsDraggingSlider(true)}
            onTouchEnd={() => {
              setIsDraggingSlider(false);
              dispatch(setCurrentTime(localTime));
            }}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              setLocalTime(time);
              playerRef.current?.seekTo(Math.round(time * fps));
            }}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Placeholder for alignment */}
        <div className="w-10"></div>
      </div>
    </>
  );
};
