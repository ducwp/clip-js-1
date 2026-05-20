"use client";

import {
  listFiles,
  deleteFile,
  useAppSelector,
  storeFile,
  getFile,
} from "@/store";
import { setMediaFiles, setFilesID } from "@/store/slices/projectSlice";
import { MediaFile, UploadedFile } from "@/types";
import { useAppDispatch } from "@/store";
import AddMedia from "../AddButtons/AddMedia";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

export default function MediaList() {
  const { mediaFiles, filesID } = useAppSelector((state) => state.projectState);
  const dispatch = useAppDispatch();
  const [files, setFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchFiles = async () => {
      try {
        const storedFilesArray: UploadedFile[] = [];

        for (const fileId of filesID || []) {
          const file = await getFile(fileId);
          if (file && mounted) {
            storedFilesArray.push({
              file: file,
              id: fileId,
            });
          }
        }

        if (mounted) {
          setFiles(storedFilesArray);
        }
      } catch (error) {
        toast.error("Error fetching files");
        console.error("Error fetching files:", error);
      }
    };

    fetchFiles();

    // Cleanup
    return () => {
      mounted = false;
    };
  }, [filesID]);

  const onDeleteMedia = async (id: string) => {
    const onUpdateMedia = mediaFiles.filter((f) => f.fileId !== id);
    dispatch(setMediaFiles(onUpdateMedia));
    dispatch(setFilesID(filesID?.filter((f) => f !== id) || []));
    await deleteFile(id);
  };

  return (
    <>
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((mediaFile) => (
            <div
              key={mediaFile.id}
              className="border border-gray-700 p-2 rounded bg-black bg-opacity-30 hover:bg-opacity-40 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <AddMedia fileId={mediaFile.id} />
                  <span
                    className="py-1 px-1 text-sm flex-1 truncate"
                    title={mediaFile.file.name}>
                    {mediaFile.file.name}
                  </span>
                </div>
                <button
                  onClick={() => onDeleteMedia(mediaFile.id)}
                  className="text-red-500 hover:text-red-700 shrink-0 ml-2"
                  aria-label="Delete file">
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
