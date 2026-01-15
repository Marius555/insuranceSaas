"use client";

import { Button } from "@/components/ui/button";
import { VideoRecorderModal } from "@/components/video-recorder";
import { Video02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface FilmVideoButtonProps {
  userId: string;
}

export function FilmVideoButton({ userId }: FilmVideoButtonProps) {
  return (
    <VideoRecorderModal userId={userId}>
      <Button>
        <HugeiconsIcon icon={Video02Icon} /> Film video
      </Button>
    </VideoRecorderModal>
  );
}
