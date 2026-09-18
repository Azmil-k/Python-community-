"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitExtraTaskAnswer } from "./actions";
import FileUploadField from "@/components/ui/FileUploadField";

export default function AnswerForm({ extraTaskId, initialSubmission }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState(false);
  const [pasteWarning, setPasteWarning] = useState("");

  async function handleSubmit(formData) {
    if (uploadError) return;
    setLoading(true);
    setError("");

    const result = await submitExtraTaskAnswer(extraTaskId, formData);
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
      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
          Your Answer
        </label>
        <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          Type your GitHub link, Replit link, or answer directly.
        </p>
        <textarea
          name="answerText"
          rows="6"
          required
          defaultValue={initialSubmission?.answerText || ""}
          placeholder="https://github.com/... or type your code/explanation here"
          onPaste={handlePaste}
        ></textarea>
        {pasteWarning ? <p style={{ color: "var(--danger-color)", marginTop: "0.5rem" }}>{pasteWarning}</p> : null}
      </div>

      <FileUploadField
        name="screenshot"
        label="Screenshot (Optional)"
        helpText="Upload an optional screenshot supporting your answer."
        required={false}
        onErrorChange={(hasError) => setUploadError(hasError)}
      />

      {error ? <p style={{ color: "var(--danger-color)" }}>{error}</p> : null}

      <button type="submit" className="btn-primary" style={{ marginTop: "1rem" }} disabled={loading || uploadError}>
        {loading ? "Submitting..." : "Submit Answer"}
      </button>
    </form>
  );
}
