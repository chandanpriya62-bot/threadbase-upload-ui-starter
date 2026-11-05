
import { useState, useRef, useEffect } from "react";
import apiClient from "../services/apiClient.js";

const MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
];

export default function AvatarUploader() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const inputRef = useRef(null);

  // TASK 1 + TASK 2 + TASK 3
  function handleFile(selectedFile) {
    if (!selectedFile) return;

    setError("");
    setProgress(0);
    setUploadedUrl("");

    // Validate file type
    if (!ALLOWED.includes(selectedFile.type)) {
      setError("Only JPEG, PNG, WebP and GIF images are allowed");
      setFile(null);
      setPreview(null);
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_SIZE) {
      setError("File is too large. Maximum size is 5MB");
      setFile(null);
      setPreview(null);
      return;
    }

    // Save valid file
    setFile(selectedFile);

    // Create local image preview
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
  }

  // Drag over handler
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  // Drag leave handler
  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  // Drop handler
  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];

    handleFile(droppedFile);
  }

  // TASK 3: Clean up preview URL
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // TASK 4: Axios upload with progress
  async function upload() {
    if (!file) return;

    const formData = new FormData();

    formData.append("avatar", file);

    try {
      setProgress(0);
      setError("");
      setUploadedUrl("");

      const res = await apiClient.post(
        "/api/upload",
        formData,
        {
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round(
                (event.loaded * 100) / event.total
              );

              setProgress(percent);
            }
          }
        }
      );

      setUploadedUrl(res.data.url);
      setProgress(100);

    } catch (err) {
      setError(
        err.response?.data?.message || "Upload failed. Please try again."
      );
    }
  }

  return (
    <div>
      <div
        className={
          isDragging
            ? "drop-zone dragging"
            : "drop-zone"
        }
        onClick={() => inputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>
          {isDragging
            ? "Drop to upload"
            : "Drag an image here, or click to choose"}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="error">{error}</p>
      )}

      {/* Image preview */}
      {preview && (
        <img
          src={preview}
          alt="Avatar preview"
          className="preview"
        />
      )}

      {/* Upload button */}
      <button
        onClick={upload}
        disabled={!file || (progress > 0 && progress < 100)}
      >
        Upload
      </button>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="bar">
          <div
            className="fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {progress > 0 && (
        <p>{progress}%</p>
      )}

      {/* Uploaded image URL */}
      {uploadedUrl && (
        <p>
          Upload successful!{" "}
          <a href={uploadedUrl} target="_blank" rel="noreferrer">
            View uploaded image
          </a>
        </p>
      )}
    </div>
  );
}
