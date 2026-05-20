"use client";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { useEffect, useRef, useState } from "react";
import { getFile, useAppSelector } from "@/store";
import { Heart } from "lucide-react";
import Image from "next/image";
import { extractConfigs } from "@/utils/extractConfigs";
import { mimeToExt } from "@/types";
import { toast } from "react-hot-toast";
import FfmpegProgressBar from "./ProgressBar";

//Shadcn UI
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  loadFunction: () => Promise<void>;
  loadFfmpeg: boolean;
  ffmpeg: FFmpeg;
  logMessages: string;
}
export default function FfmpegRender({
  loadFunction,
  loadFfmpeg,
  ffmpeg,
  logMessages,
}: FileUploaderProps) {
  const {
    mediaFiles,
    projectName,
    exportSettings,
    duration,
    textElements,
    resolution,
  } = useAppSelector((state) => state.projectState);
  const totalDuration = duration;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (loaded && videoRef.current && previewUrl) {
      videoRef.current.src = previewUrl;
    }
  }, [loaded, previewUrl]);

  const handleCloseModal = async () => {
    setShowModal(false);
    setIsRendering(false);
    try {
      ffmpeg.terminate();
      await loadFunction();
    } catch (e) {
      console.error("Failed to reset FFmpeg:", e);
    }
  };

  const render = async () => {
    if (mediaFiles.length === 0 && textElements.length === 0) {
      console.log("No media files to render");
      return;
    }
    setShowModal(true);
    setIsRendering(true);

    const renderFunction = async () => {
      const params = extractConfigs(exportSettings);

      try {
        const filters = [];
        const overlays = [];
        const inputs = [];
        const audioDelays = [];

        // Create base black background with project resolution
        const resWidth = resolution?.width || 720;
        const resHeight = resolution?.height || 1280;
        filters.push(
          `color=c=black:size=${resWidth}x${resHeight}:d=${totalDuration.toFixed(
            3,
          )}[base]`,
        );
        // Sort videos by zIndex ascending (lowest drawn first)
        const sortedMediaFiles = [...mediaFiles].sort(
          (a, b) => (a.zIndex || 0) - (b.zIndex || 0),
        );

        for (let i = 0; i < sortedMediaFiles.length; i++) {
          console.log("sortedMediaFiles[i]", sortedMediaFiles[i])
          // timing
          const { startTime, positionStart, positionEnd } = sortedMediaFiles[i];
          const duration = positionEnd - positionStart;

          // get the file data and write to ffmpeg
          const fileData = await getFile(sortedMediaFiles[i].fileId);
          const buffer = await fileData?.arrayBuffer();
          /* const ext =
            mimeToExt[fileData.type as keyof typeof mimeToExt] ||
            fileData.type.split("/")[1] || 'mp4'; */

          const ext = 'mp4'  

          await ffmpeg.writeFile(`input${i}.${ext}`, new Uint8Array(buffer));

          // TODO: currently we have to write same file if it's used more than once in different clips the below approach is a good start to change this
          // let wroteFiles = new Map<string, string>();
          // const { fileId, type } = sortedMediaFiles[i];
          // let inputFilename: string;

          // if (wroteFiles.has(fileId)) {
          //     inputFilename = wroteFiles.get(fileId)!;
          // } else {
          //     const fileData = await getFile(fileId);
          //     const buffer = await fileData.arrayBuffer();
          //     const ext = mimeToExt[fileData.type as keyof typeof mimeToExt] || fileData.type.split('/')[1];
          //     inputFilename = `input_${fileId}.${ext}`;
          //     await ffmpeg.writeFile(inputFilename, new Uint8Array(buffer));
          //     wroteFiles.set(fileId, inputFilename);
          // }

          if (sortedMediaFiles[i].type === "image") {
            inputs.push(
              "-loop",
              "1",
              "-t",
              duration.toFixed(3),
              "-i",
              `input${i}.${ext}`,
            );
          } else {
            inputs.push("-i", `input${i}.${ext}`);
          }

          const visualLabel = `visual${i}`;
          const audioLabel = `audio${i}`;

          // Shift clip to correct place on timeline (video)
          if (sortedMediaFiles[i].type === "video") {
            filters.push(
              `[${i}:v]trim=start=${startTime.toFixed(
                3,
              )}:duration=${duration.toFixed(3)},scale=${
                sortedMediaFiles[i].width
              }:${
                sortedMediaFiles[i].height
              },setpts=PTS-STARTPTS+${positionStart.toFixed(
                3,
              )}/TB[${visualLabel}]`,
            );
          }
          if (sortedMediaFiles[i].type === "image") {
            filters.push(
              `[${i}:v]scale=${sortedMediaFiles[i].width}:${
                sortedMediaFiles[i].height
              },setpts=PTS+${positionStart.toFixed(3)}/TB[${visualLabel}]`,
            );
          }

          // Apply opacity
          if (
            sortedMediaFiles[i].type === "video" ||
            sortedMediaFiles[i].type === "image"
          ) {
            const alpha = Math.min(
              Math.max((sortedMediaFiles[i].opacity || 100) / 100, 0),
              1,
            );
            filters.push(
              `[${visualLabel}]format=yuva420p,colorchannelmixer=aa=${alpha}[${visualLabel}]`,
            );
          }

          // Store overlay range that matches shifted time
          if (
            sortedMediaFiles[i].type === "video" ||
            sortedMediaFiles[i].type === "image"
          ) {
            overlays.push({
              label: visualLabel,
              x: sortedMediaFiles[i].x,
              y: sortedMediaFiles[i].y,
              start: positionStart.toFixed(3),
              end: positionEnd.toFixed(3),
            });
          }

          // Audio: trim, then delay (in ms)
          if (
            sortedMediaFiles[i].type === "audio" ||
            sortedMediaFiles[i].type === "video"
          ) {
            const delayMs = Math.round(positionStart * 1000);
            const volume =
              sortedMediaFiles[i].volume !== undefined
                ? sortedMediaFiles[i].volume / 100
                : 1;
            filters.push(
              `[${i}:a]atrim=start=${startTime.toFixed(
                3,
              )}:duration=${duration.toFixed(
                3,
              )},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${volume}[${audioLabel}]`,
            );
            audioDelays.push(`[${audioLabel}]`);
          }
        }

        // Apply overlays in z-index order
        let lastLabel = "base";
        if (overlays.length > 0) {
          for (let i = 0; i < overlays.length; i++) {
            const { label, start, end, x, y } = overlays[i];
            const nextLabel = `overlay_tmp${i}`;
            filters.push(
              `[${lastLabel}][${label}]overlay=${x}:${y}:enable='between(t\\,${start}\\,${end})'[${nextLabel}]`,
            );
            lastLabel = nextLabel;
          }
        }

        // Apply text
        if (textElements.length > 0) {
          // load fonts
          let fonts = ["Arial", "Inter", "Lato"];
          for (let i = 0; i < fonts.length; i++) {
            const font = fonts[i];
            const res = await fetch(`/fonts/${font}.ttf`);
            const fontBuf = await res.arrayBuffer();
            await ffmpeg.writeFile(`font${font}.ttf`, new Uint8Array(fontBuf));
          }
          // Apply text
          for (let i = 0; i < textElements.length; i++) {
            const text = textElements[i];
            const label = `text_tmp${i}`;
            const escapedText = text.text
              .replace(/:/g, "\\:")
              .replace(/'/g, "\\\\'");
            const alpha = Math.min(Math.max((text.opacity ?? 100) / 100, 0), 1);
            const color = text.color?.includes("@")
              ? text.color
              : `${text.color || "white"}@${alpha}`;
            filters.push(
              `[${lastLabel}]drawtext=fontfile=font${
                text.font
              }.ttf:text='${escapedText}':x=${text.x}:y=${text.y}:fontsize=${
                text.fontSize || 24
              }:fontcolor=${color}:enable='between(t\\,${
                text.positionStart
              }\\,${text.positionEnd})'[${label}]`,
            );
            lastLabel = label;
          }
        }

        // Determine target dimensions based on exportSettings.resolution (treating values as target width)
        let targetWidth = 720;
        switch (exportSettings.resolution) {
          case "480p":
            targetWidth = 480;
            break;
          case "720p":
            targetWidth = 720;
            break;
          case "1080p":
            targetWidth = 1080;
            break;
          case "2K":
            targetWidth = 2048;
            break;
          case "4K":
            targetWidth = 3840;
            break;
          default:
            targetWidth = 720;
        }

        const aspectRatio = resolution.width / resolution.height;
        let targetHeight = Math.round(targetWidth / aspectRatio);
        if (targetWidth % 2 !== 0) {
          targetWidth += 1;
        }
        if (targetHeight % 2 !== 0) {
          targetHeight += 1;
        }

        // Final scale to export resolution and output to [outv]
        filters.push(
          `[${lastLabel}]scale=${targetWidth}:${targetHeight}[outv]`,
        );

        // Mix all audio tracks
        if (audioDelays.length > 0) {
          const audioMix = audioDelays.join("");
          filters.push(
            `${audioMix}amix=inputs=${audioDelays.length}:normalize=0[outa]`,
          );
        }

        // Final filter_complex
        const complexFilter = filters.join("; ");
        const ffmpegArgs = [
          ...inputs,
          "-filter_complex",
          complexFilter,
          "-map",
          "[outv]",
        ];

        if (audioDelays.length > 0) {
          ffmpegArgs.push("-map", "[outa]");
        }

        ffmpegArgs.push(
          "-c:v",
          "libx264",
          "-c:a",
          "aac",
          "-preset",
          params.preset,
          "-crf",
          params.crf.toString(),
          "-t",
          totalDuration.toFixed(3),
          "output.mp4",
        );

        await ffmpeg.exec(ffmpegArgs);
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === "called FFmpeg.terminate()"
        ) {
          console.log("FFmpeg rendering was cancelled by user.");
          return null;
        }
        console.error("FFmpeg processing error:", err);
        throw err;
      }

      // return the output url
      const outputData = await ffmpeg.readFile("output.mp4");
      const outputBlob = new Blob([outputData as Uint8Array], {
        type: "video/mp4",
      });
      const outputUrl = URL.createObjectURL(outputBlob);
      return outputUrl;
    };

    // Run the function and handle the result/error
    try {
      const outputUrl = await renderFunction();
      if (!outputUrl) return; // Ignore if cancelled
      setPreviewUrl(outputUrl);
      setLoaded(true);
      setIsRendering(false);
      toast.success("Video rendered successfully");
    } catch (err) {
      toast.error("Failed to render video");
      console.error("Failed to render video:", err);
    }
  };

  return (
    <>
      {/* Render Button */}
      <button
        onClick={() => render()}
        className={`inline-flex items-center p-3 bg-white hover:bg-[#ccc] rounded-lg disabled:opacity-50 text-gray-900 font-bold transition-all transform`}
        disabled={
          !loadFfmpeg ||
          isRendering ||
          (mediaFiles.length === 0 && textElements.length === 0)
        }>
        {(!loadFfmpeg || isRendering) && (
          <span className="animate-spin mr-2">
            <svg
              viewBox="0 0 1024 1024"
              focusable="false"
              data-icon="loading"
              width="1em"
              height="1em">
              <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path>
            </svg>
          </span>
        )}
        <p>
          {loadFfmpeg
            ? isRendering
              ? "Rendering..."
              : "Render"
            : "Loading FFmpeg..."}
        </p>
      </button>

      {/* Render Modal */}
      {showModal && (
        <>
          <Dialog>
            <DialogTrigger>Open</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isRendering ? "Rendering..." : `${projectName}`}
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>

              {isRendering ? (
                <div>
                  <div className="bg-black p-2 h-40 text-sm font-mono rounded">
                    <div>{logMessages}</div>
                    <p className="text-xs text-gray-400 italic">
                      The progress bar is experimental in FFmpeg WASM, so it
                      might appear slow or unresponsive even though the actual
                      processing is not.
                    </p>
                    <FfmpegProgressBar ffmpeg={ffmpeg} />
                  </div>
                </div>
              ) : (
                <div>
                  {previewUrl && (
                    <video src={previewUrl} controls className="w-full mb-4" />
                  )}
                  <div className="flex justify-between">
                    <a
                      href={previewUrl || "#"}
                      download={`${projectName}.mp4`}
                      className={`inline-flex items-center p-3 bg-white hover:bg-[#ccc] rounded-lg text-gray-900 font-bold transition-all transform `}>
                      <Image
                        alt="Download"
                        className="Black"
                        height={18}
                        src={"https://www.svgrepo.com/show/501347/save.svg"}
                        width={18}
                      />
                      <span className="ml-2">Save Video</span>
                    </a>
                    <a
                      href="https://github.com/sponsors/mohyware"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center p-3 bg-pink-600 hover:bg-pink-500 rounded-lg text-gray-900 font-bold transition-all transform`}>
                      <Heart size={20} className="mr-2" />
                      Sponsor on Github
                    </a>
                  </div>
                </div>
              )}

              {/* <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter> */}
              <button
                  onClick={handleCloseModal}
                  className="text-white text-4xl font-bold hover:text-red-400"
                  aria-label="Close">
                  &times;
                </button>
            </DialogContent>
          </Dialog>

          
        </>
      )}
    </>
  );
}
