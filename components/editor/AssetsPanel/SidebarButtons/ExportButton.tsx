import Image from "next/image";

import { Button } from "@/components/ui/button";
import { CornerDownRight } from "lucide-react";

export default function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex flex-col items-center justify-center h-auto py-2 px-2 sm:px-5 sm:w-auto">
      <CornerDownRight className="invert h-auto w-auto max-w-[24px] max-h-[24px] text-black" />
      <span className="text-xs">Export</span>
    </Button>
  );
}
