import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CloudUpload} from "lucide-react";

export default function LibraryButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex flex-col items-center justify-center h-auto py-2 px-2 sm:px-5 sm:w-auto">
      <CloudUpload className="invert h-auto w-auto max-w-[24px] max-h-[24px] text-black" />
      <span className="text-xs">Library</span>
    </Button>
  );
}
