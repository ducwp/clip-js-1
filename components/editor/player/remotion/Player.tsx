import { Player, PlayerRef } from "@remotion/player";
import Composition from "./sequence/composition";
import { useAppSelector, useAppDispatch } from "@/store";
import { useRef, useState, useEffect } from "react";
import { setIsPlaying, setCurrentTime } from "@/store/slices/projectSlice";
import { useDispatch } from "react-redux";

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
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col w-full h-full items-center justify-center bg-[#141416]">
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                <Player
                    ref={playerRef}
                    component={Composition}
                    inputProps={{}}
                    durationInFrames={Math.max(30, Math.floor((isNaN(duration) ? 0 : duration) * fps) + 1)}
                    compositionWidth={previewWidth}
                    compositionHeight={previewHeight}
                    fps={fps}
                    style={{ width: "100%", height: "100%", backgroundColor: "#1E1D21" }}
                    controls={false}
                    clickToPlay={false}
                    acknowledgeRemotionLicense={true}
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
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m-9-6a9 9 0 1118 0 9 9 0 01-18 0z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 01-18 0z" />
                            </svg>
                        )}
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
        </div>
    );
};