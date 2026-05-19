import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Captions } from "lucide-react";

export default function CaptionsButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      className="flex flex-col items-center justify-center h-auto py-2 px-2 sm:px-5 sm:w-auto"
      onClick={onClick}>
      <Captions className="invert h-auto w-auto max-w-[24px] max-h-[24px] text-black" />
      <span className="text-xs">Captions</span>
    </Button>
  );
}
