"use client";
import { useState } from "react";

export default function FileUploadField({
  name,
  label,
  helpText,
  maxSizeBytes = 3 * 1024 * 1024,
  allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"],
  required = false,
  onErrorChange
}) {
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError("");
      if (onErrorChange) onErrorChange(false);
      return;
    }

    if (file.size > maxSizeBytes) {
      setError("File exceeds the 3MB limit. Please upload a smaller file.");
      if (onErrorChange) onErrorChange(true);
      return;
    }

    if (!allowedMimeTypes.includes(file.type)) {
      setError("Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG file.");
      if (onErrorChange) onErrorChange(true);
      return;
    }

    setError("");
    if (onErrorChange) onErrorChange(false);
  };

  return (
    <div>
      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
        {label}
      </label>
      {helpText && (
        <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          {helpText}
        </p>
      )}
      <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
        Maximum file size: 3MB. Allowed file types: PDF, JPEG, JPG, PNG.
      </p>
      <input
        type="file"
        name={name}
        accept={allowedMimeTypes.join(",")}
        required={required}
        onChange={handleFileChange}
        style={{ background: "rgba(0,0,0,0.1)" }}
      />
      {error && (
        <p style={{ color: "var(--danger-color)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
