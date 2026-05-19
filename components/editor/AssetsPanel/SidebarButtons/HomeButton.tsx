"use client";
import { Link } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
export default function HomeButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={() => router.push("/")}
      className="flex flex-col items-center justify-center h-auto py-2 px-2 sm:px-5 sm:w-auto">
      <Home className="invert h-auto w-auto max-w-[24px] max-h-[24px] text-black" />
      <span className="text-xs">Home</span>
    </Button>
  );
}
