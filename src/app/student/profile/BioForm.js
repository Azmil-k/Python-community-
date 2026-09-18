"use client";

import { useState } from "react";
import { updateBio } from "./actions";

export default function BioForm({ initialBio }) {
  const [bio, setBio] = useState(initialBio || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await updateBio(bio);
      if (res?.success) {
        setSaved(true);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div style={{ marginTop: "1rem" }}>
        <p style={{ color: bio ? "var(--text-primary)" : "var(--text-secondary)", fontStyle: bio ? "normal" : "italic", margin: "0 0 0.75rem 0" }}>
          {bio || "No bio added yet."}
        </p>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="btn-secondary"
          style={{ padding: "0.35rem 0.8rem", fontSize: "0.85rem" }}
        >
          {bio ? "Edit Bio" : "+ Add Bio"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, 500))}
        placeholder="Tell us a bit about your programming journey, goals, or background..."
        rows="3"
        style={{ width: "100%", padding: "0.75rem", background: "var(--bg-color)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontFamily: "inherit" }}
      />
      <div className="flex justify-between items-center">
        <span style={{ fontSize: "0.8rem", color: bio.length >= 480 ? "var(--accent-color)" : "var(--text-secondary)" }}>
          {bio.length} / 500 characters
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setBio(initialBio || ""); setIsEditing(false); }}
            className="btn-secondary"
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
          >
            {saving ? "Saving..." : "Save Bio"}
          </button>
        </div>
      </div>
      {saved && <span style={{ color: "var(--success-color)", fontSize: "0.85rem" }}>Bio saved successfully!</span>}
    </form>
  );
}
