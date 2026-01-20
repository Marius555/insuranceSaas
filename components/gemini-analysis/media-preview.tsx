"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Video02Icon, Image02Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
interface MediaPreviewProps {
  files: File[];
  onRemove: (index: number) => void;
  mediaType: 'image' | 'video';
  showAngleSelector?: boolean; // for images
  onAngleChange?: (index: number, angle: string) => void;
  displayMode?: 'grid' | 'compact'; // 'grid' shows thumbnails, 'compact' shows file info boxes
}

const angleOptions = [
  { value: 'front', label: 'Front' },
  { value: 'rear', label: 'Rear' },
  { value: 'side_left', label: 'Left Side' },
  { value: 'side_right', label: 'Right Side' },
  { value: 'overhead', label: 'Overhead' },
];

export function MediaPreview({
  files,
  onRemove,
  mediaType,
  showAngleSelector = false,
  onAngleChange,
  displayMode = 'grid',
}: MediaPreviewProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [angles, setAngles] = useState<Record<number, string>>({});

  // Generate previews for images
  useEffect(() => {
    if (mediaType === 'image') {
      const newPreviews: string[] = [];

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) {
            setPreviews([...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }

    return () => {
      // Clean up object URLs
      previews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [files, mediaType, previews]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleAngleChange = (index: number, angle: string) => {
    setAngles(prev => ({ ...prev, [index]: angle }));
    onAngleChange?.(index, angle);
  };

  if (files.length === 0) return null;

  // Compact mode: Show file info boxes without thumbnails
  if (displayMode === 'compact') {
    return (
      <div className="space-y-3">
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HugeiconsIcon
                  icon={mediaType === 'video' ? Video02Icon : Image02Icon}
                  className={cn(
                    "h-8 w-8",
                    mediaType === 'video' ? "text-blue-500" : "text-green-500"
                  )}
                />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                    <Badge variant="outline" className="ml-2">
                      {file.type.split('/')[0].toUpperCase()}
                    </Badge>
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
              >
                <HugeiconsIcon icon={Delete02Icon} color="red"/>
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Grid mode: Show thumbnails in grid layout (existing behavior)
  return (
    <div className="space-y-3">
      <div className={cn(
        "grid gap-4 max-h-100 overflow-y-auto",
        files.length === 1 && "grid-cols-1",
        files.length === 2 && "grid-cols-2",
        files.length >= 3 && "grid-cols-2 sm:grid-cols-3"
      )}>
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="group relative rounded-lg border border-border bg-card overflow-hidden"
          >
            {/* Preview Image/Video */}
            {mediaType === 'image' && previews[index] && (
              <div className="aspect-square overflow-hidden bg-muted max-h-37.5">
                <Image
                  fill
                  src={previews[index]}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {mediaType === 'video' && (
              <div className="aspect-square flex items-center justify-center bg-muted max-h-37.5">
                <div className="text-center p-4">
                  <svg
                    className="mx-auto h-12 w-12 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
                    />
                  </svg>
                  <p className="text-xs text-muted-foreground mt-2">Video</p>
                </div>
              </div>
            )}

            {/* Remove Button */}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(index)}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>

            {/* File Info */}
            <div className="p-3 space-y-2">
              <p className="text-xs font-medium truncate" title={file.name}>
                {file.name}
              </p>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {formatFileSize(file.size)}
                </Badge>

                <Badge variant="outline" className="text-xs">
                  {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                </Badge>
              </div>

              {/* Angle Selector for Images */}
              {showAngleSelector && mediaType === 'image' && onAngleChange && (
                <select
                  value={angles[index] || ''}
                  onChange={(e) => handleAngleChange(index, e.target.value)}
                  className="w-full text-xs rounded-md border border-input bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select angle (optional)</option>
                  {angleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {files.length} file{files.length > 1 ? 's' : ''} selected
        {mediaType === 'image' && files.length < 5 && ' (you can add more)'}
      </p>
    </div>
  );
}
