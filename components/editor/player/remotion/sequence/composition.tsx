import { storeProject, useAppDispatch, useAppSelector } from "@/store";
import { SequenceItem } from "./sequence-item";
import { MediaFile, TextElement } from "@/types";
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';
import { use, useCallback, useEffect, useRef, useState, Fragment } from "react";
import { setCurrentTime, setMediaFiles } from "@/store/slices/projectSlice";

const Composition = () => {
    const mediaFiles = useAppSelector((state) => state.projectState.mediaFiles);
    const textElements = useAppSelector((state) => state.projectState.textElements);
    const frame = useCurrentFrame();
    const dispatch = useAppDispatch();
    const isPlaying = useAppSelector((state) => state.projectState.isPlaying);

    const fps = 30;
    const THRESHOLD = 0.1; // Minimum change to trigger dispatch (in seconds)
    const previousTime = useRef(0); // Store previous time to track changes

    useEffect(() => {
        if (!isPlaying) return; // Only sync when playing!
        
        const currentTimeInSeconds = frame / fps;
        if (Math.abs(currentTimeInSeconds - previousTime.current) > THRESHOLD) {
            if (currentTimeInSeconds !== undefined) {
                dispatch(setCurrentTime(currentTimeInSeconds));
                previousTime.current = currentTimeInSeconds;
            }
        }

    }, [frame, dispatch, isPlaying]);
    const config = useVideoConfig();
    const resolution = useAppSelector((state) => state.projectState.resolution);
    const scaleFactor = config.height / resolution.height;

    return (
        <>
            <AbsoluteFill style={{ backgroundColor: 'black' }} />
            <div style={{ 
                transform: `scale(${scaleFactor})`, 
                transformOrigin: 'top left', 
                width: resolution.width, 
                height: resolution.height,
                position: 'absolute',
                top: 0,
                left: 0
            }}>
                {mediaFiles
                    .map((item: MediaFile) => {
                        if (!item) return;
                        const trackItem = {
                            ...item,
                        } as MediaFile;
                        return (
                            <Fragment key={trackItem.id}>
                                {SequenceItem[trackItem.type](trackItem, { fps })}
                            </Fragment>
                        );
                    })}
                {textElements
                    .map((item: TextElement) => {
                        if (!item) return;
                        const trackItem = {
                            ...item,
                        } as TextElement;
                        return (
                            <Fragment key={trackItem.id}>
                                {SequenceItem["text"](trackItem, { fps })}
                            </Fragment>
                        );
                    })}
            </div>
        </>
    );
};

export default Composition;
