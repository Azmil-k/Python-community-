"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitTask } from "./actions";
import FileUploadField from "@/components/ui/FileUploadField";

export default function SubmitForm({ weekId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState(false);
  const [pasteWarning, setPasteWarning] = useState("");

  async function handleSubmit(formData) {
    if (uploadError) return;
    setLoading(true);
    setError("");

    const result = await submitTask(weekId, formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/student/dashboard");
  }

  function handlePaste(e) {
    e.preventDefault();
    setPasteWarning("Pasting is disabled for this field — please type your answer.");
    window.setTimeout(() => setPasteWarning(""), 4000);
  }
 
  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <FileUploadField
        name="screenshot"
        label="FreeCodeCamp Screenshot"
        helpText="Upload a screenshot showing your completed modules for this week."
        required={true}
        onErrorChange={(hasError) => setUploadError(hasError)}
      />

      <div style={{ marginTop: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
          End of Week Task Link or Code
        </label>
        <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          Type your Replit/GitHub link or code directly into this field.
        </p>
        <textarea name="taskLinkOrCode" rows="5" required placeholder="https://replit.com/... or print('Hello')" onPaste={handlePaste}></textarea>
        {pasteWarning ? <p style={{ color: "var(--danger-color)", marginTop: "0.5rem" }}>{pasteWarning}</p> : null}
      </div>

      {error ? <p style={{ color: "var(--danger-color)" }}>{error}</p> : null}

      <button type="submit" className="btn-primary" style={{ marginTop: "1rem" }} disabled={loading || uploadError}>
        {loading ? "Submitting..." : "Submit Task"}
      </button>
    </form>
  );
}
