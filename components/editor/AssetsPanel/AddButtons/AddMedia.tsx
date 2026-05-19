"use client";

import { getFile, useAppDispatch, useAppSelector } from "@/store";
import { setMediaFiles } from "@/store/slices/projectSlice";
import { storeFile } from "@/store";
import { categorizeFile } from "@/utils/utils";
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function AddMedia({ fileId }: { fileId: string }) {
    const { mediaFiles, resolution } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();

    const handleFileChange = async () => {
        const updatedMedia = [...mediaFiles];

        const file = await getFile(fileId);
        const mediaId = crypto.randomUUID();

        if (fileId) {
            const relevantClips = mediaFiles.filter(clip => clip.type === categorizeFile(file.type));
            const lastEnd = relevantClips.length > 0
                ? Math.max(...relevantClips.map(f => f.positionEnd))
                : 0;

            const fileType = categorizeFile(file.type);
            let vWidth = 1000;
            let vHeight = 1000;
            let duration = 30; // Default fallback

            if (fileType === 'video' || fileType === 'image' || fileType === 'audio') {
                try {
                    const dimensions = await new Promise<{ width: number, height: number, duration: number }>((resolve, reject) => {
                        const url = URL.createObjectURL(file);
                        if (fileType === 'video') {
                            const video = document.createElement('video');
                            video.preload = 'metadata';
                            video.onloadedmetadata = () => {
                                URL.revokeObjectURL(url);
                                resolve({ width: video.videoWidth, height: video.videoHeight, duration: video.duration });
                            };
                            video.onerror = () => reject('Error loading video');
                            video.src = url;
                        } else if (fileType === 'audio') {
                            const audio = document.createElement('audio');
                            audio.preload = 'metadata';
                            audio.onloadedmetadata = () => {
                                URL.revokeObjectURL(url);
                                resolve({ width: 0, height: 0, duration: audio.duration });
                            };
                            audio.onerror = () => reject('Error loading audio');
                            audio.src = url;
                        } else {
                            const img = new window.Image();
                            img.onload = () => {
                                URL.revokeObjectURL(url);
                                resolve({ width: img.naturalWidth, height: img.naturalHeight, duration: 5 }); // Default 5s for images
                            };
                            img.onerror = () => reject('Error loading image');
                            img.src = url;
                        }
                    });
                    vWidth = dimensions.width;
                    vHeight = dimensions.height;
                    duration = dimensions.duration;
                } catch (error) {
                    console.error("Error getting media dimensions and duration:", error);
                    // Fallback to default 1920x1080 and 30s
                }
            }

            // Calculate scaled dimensions to fit project resolution
            const pWidth = resolution.width;
            const pHeight = resolution.height;
            let scaledWidth = 0;
            let scaledHeight = 0;

            if (fileType !== 'audio') {
                const scale = Math.min(pWidth / vWidth, pHeight / vHeight);
                scaledWidth = vWidth * scale;
                scaledHeight = vHeight * scale;
            }

            updatedMedia.push({
                id: mediaId,
                fileName: file.name,
                fileId: fileId,
                startTime: 0,
                endTime: duration,
                src: URL.createObjectURL(file),
                positionStart: lastEnd,
                positionEnd: lastEnd + duration,
                includeInMerge: true,
                x: (pWidth - scaledWidth) / 2,
                y: (pHeight - scaledHeight) / 2,
                width: scaledWidth,
                height: scaledHeight,
                rotation: 0,
                opacity: 100,
                crop: { x: 0, y: 0, width: vWidth, height: vHeight },
                playbackSpeed: 1,
                volume: 100,
                type: fileType,
                zIndex: 0,
            });
        }
        dispatch(setMediaFiles(updatedMedia));
        toast.success('Media added successfully.');
    };

    return (
        <div
        >
            <label
                className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-col items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium sm:text-base py-2 px-2"
            >
                <Image
                    alt="Add Project"
                    className="Black"
                    height={12}
                    width={12}
                    src="https://www.svgrepo.com/show/513803/add.svg"
                />
                {/* <span className="text-xs">Add Media</span> */}
                <button
                    onClick={handleFileChange}
                >
                </button>
            </label>
        </div>
    );
}
