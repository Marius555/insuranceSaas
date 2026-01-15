"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  accept: string; // MIME types (e.g., "image/*,video/*")
  maxSize?: number; // bytes (default 20MB)
  multiple?: boolean;
  maxFiles?: number; // for images: 5
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  label: string;
  description?: string;
}

export function FileUploadZone({
  accept,
  maxSize = 20 * 1024 * 1024, // 20MB default
  multiple = false,
  maxFiles,
  onFilesSelected,
  disabled = false,
  label,
  description,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: FileList | File[]): File[] | null => {
    const fileArray = Array.from(files);

    // Check file count
    if (maxFiles && fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} file(s) allowed`);
      return null;
    }

    // Validate each file
    for (const file of fileArray) {
      // Check file type
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          const mainType = type.split('/')[0];
          return file.type.startsWith(mainType + '/');
        }
        return file.type === type;
      });

      if (!isAccepted) {
        setError(`File type ${file.type} not accepted. Allowed: ${accept}`);
        return null;
      }

      // Check file size
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        setError(`File "${file.name}" (${fileSizeMB}MB) exceeds ${maxSizeMB}MB limit`);
        return null;
      }
    }

    setError("");
    return fileArray;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles = validateFiles(files);
    if (validFiles) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;

    const validFiles = validateFiles(files);
    if (validFiles) {
      onFilesSelected(validFiles);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label}
      </label>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors cursor-pointer min-h-[80px]",
          isDragging && !disabled && "border-primary bg-primary/5",
          !isDragging && !disabled && "border-border hover:border-primary hover:bg-accent",
          disabled && "opacity-50 cursor-not-allowed bg-muted",
          error && "border-destructive"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="text-center space-y-1">
          <div className="text-sm">
            <span className="font-semibold text-primary">Click to upload</span>
            {!disabled && (
              <span className="text-muted-foreground"> or drag and drop</span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {accept.includes('image') && 'Images: JPG, PNG, WebP'}
            {accept.includes('video') && 'Videos: MP4, MOV, AVI'}
            {accept.includes('pdf') && 'PDF documents'}
            {' '}(max {(maxSize / 1024 / 1024).toFixed(0)}MB
            {maxFiles && `, up to ${maxFiles} file${maxFiles > 1 ? 's' : ''}`})
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive mt-2">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
