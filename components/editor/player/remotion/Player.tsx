import { Player, PlayerRef } from "@remotion/player";
import Composition from "./sequence/composition";
import { useAppSelector, useAppDispatch } from "@/store";
import { useRef, useState, useEffect } from "react";
import { setIsPlaying } from "@/store/slices/projectSlice";
import { useDispatch } from "react-redux";

const fps = 30;

export const PreviewPlayer = () => {
    const duration = useAppSelector((state) => state.projectState.duration);
    const currentTime = useAppSelector((state) => state.projectState.currentTime);
    const isPlaying = useAppSelector((state) => state.projectState.isPlaying);
    const isMuted = useAppSelector((state) => state.projectState.isMuted);
    const resolution = useAppSelector((state) => state.projectState.resolution);
    console.log("Player.tsx - duration:", duration, "fps:", fps);
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

    return (
        <Player
            ref={playerRef}
            component={Composition}
            inputProps={{}}
            durationInFrames={Math.max(30, Math.floor((isNaN(duration) ? 0 : duration) * fps) + 1)}
            compositionWidth={resolution.width}
            compositionHeight={resolution.height}
            fps={fps}
            style={{ width: "100%", height: "100%", backgroundColor: "#1E1D21" }}
            controls
            clickToPlay={false}
            acknowledgeRemotionLicense={true}
        />
    )
};