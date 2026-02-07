/**
 * DocumentUpload Component
 *
 * File upload component with drag-and-drop support, validation, and progress indicator.
 * Supports PDF, TXT, MD, and DOCX files up to 25MB.
 */
"use client";

import { useCallback, useRef, useState } from "react";

import { useIngestDocument } from "@/hooks";
import type { FileValidationResult, SupportedFileType } from "@/types";

/**
 * DocumentUpload Component
 *
 * File upload component with drag-and-drop support, validation, and progress indicator.
 * Supports PDF, TXT, MD, and DOCX files up to 25MB.
 */

interface DocumentUploadProps {
  /** Bonfire ID to upload to */
  bonfireId: string;
  /** Callback on successful upload */
  onUploadSuccess?: (documentId: string) => void;
  /** Callback on upload error */
  onUploadError?: (error: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disable the upload */
  disabled?: boolean;
}

/** Maximum file size in bytes (25MB) */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

/** Supported MIME types mapping */
const SUPPORTED_TYPES: Record<string, SupportedFileType> = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/markdown": "md",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

/** File extensions mapping */
const EXTENSION_MAP: Record<string, SupportedFileType> = {
  ".pdf": "pdf",
  ".txt": "txt",
  ".md": "md",
  ".docx": "docx",
};

/**
 * Validate a file for upload
 */
function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 25MB limit. Size: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
    };
  }

  // Check by MIME type first
  const mimeType = SUPPORTED_TYPES[file.type];
  if (mimeType) {
    return { valid: true, file, type: mimeType };
  }

  // Fall back to extension check
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (extension && EXTENSION_MAP[extension]) {
    return { valid: true, file, type: EXTENSION_MAP[extension] };
  }

  return {
    valid: false,
    error: `Unsupported file format. Supported formats: PDF, TXT, MD, DOCX`,
  };
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentUpload({
  bonfireId,
  onUploadSuccess,
  onUploadError,
  className = "",
  disabled = false,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ingestMutation = useIngestDocument();

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        setValidationError(validation.error ?? "Invalid file");
        setSelectedFile(null);
        onUploadError?.(validation.error ?? "Invalid file");
        return;
      }

      setValidationError(null);
      setSelectedFile(file);
    },
    [onUploadError]
  );

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // Handle drag events
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [disabled, handleFileSelect]
  );

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile || !bonfireId) return;

    setUploadProgress(0);

    try {
      // Simulate progress (since we don't have real progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null || prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      const result = await ingestMutation.mutateAsync({
        bonfireId,
        file: selectedFile,
        filename: selectedFile.name,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Reset after success
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 1000);

      onUploadSuccess?.(result.documentId);
    } catch (error) {
      setUploadProgress(null);
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setValidationError(errorMessage);
      onUploadError?.(errorMessage);
    }
  }, [selectedFile, bonfireId, ingestMutation, onUploadSuccess, onUploadError]);

  // Clear selected file
  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setValidationError(null);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Click to browse
  const handleClick = useCallback(() => {
    if (!disabled && !selectedFile) {
      fileInputRef.current?.click();
    }
  }, [disabled, selectedFile]);

  const isUploading = ingestMutation.isPending || uploadProgress !== null;
  const isDisabled = disabled || !bonfireId || isUploading;

  return (
    <div className={`w-full ${className}`}>
      {/* Drop zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragging ? "border-primary bg-primary/10" : "border-base-300 hover:border-primary/50"}
          ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          ${validationError ? "border-error bg-error/5" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.docx"
          onChange={handleInputChange}
          disabled={isDisabled}
          className="hidden"
        />

        {/* Upload icon */}
        <div className="flex flex-col items-center gap-3">
          <svg
            className={`w-12 h-12 ${validationError ? "text-error" : "text-base-content/50"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          {/* Text */}
          {selectedFile ? (
            <div className="space-y-1">
              <p className="font-medium text-base-content">
                {selectedFile.name}
              </p>
              <p className="text-sm text-base-content/60">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-medium text-base-content">
                {isDragging ? "Drop file here" : "Drag and drop a file here"}
              </p>
              <p className="text-sm text-base-content/60">or click to browse</p>
              <p className="text-xs text-base-content/40 mt-2">
                Supported: PDF, TXT, MD, DOCX (max 25MB)
              </p>
            </div>
          )}
        </div>

        {/* Upload progress */}
        {uploadProgress !== null && (
          <div className="mt-4">
            <progress
              className="progress progress-primary w-full"
              value={uploadProgress}
              max={100}
            />
            <p className="text-xs text-base-content/60 mt-1">
              {uploadProgress === 100
                ? "Upload complete!"
                : `Uploading... ${uploadProgress}%`}
            </p>
          </div>
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="alert alert-error mt-3">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{validationError}</span>
          <button
            className="btn btn-ghost btn-xs"
            onClick={(e) => {
              e.stopPropagation();
              setValidationError(null);
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action buttons */}
      {selectedFile && !isUploading && (
        <div className="flex gap-2 mt-4">
          <button
            className="btn btn-primary flex-1"
            onClick={handleUpload}
            disabled={isDisabled}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Upload Document
          </button>
          <button className="btn btn-ghost" onClick={handleClear}>
            Cancel
          </button>
        </div>
      )}

      {/* No bonfire selected warning */}
      {!bonfireId && (
        <div className="alert alert-warning mt-3">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Please select a bonfire first to upload documents</span>
        </div>
      )}
    </div>
  );
}
