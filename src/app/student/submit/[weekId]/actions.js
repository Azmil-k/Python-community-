"use server";

import { getUser } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import supabase from "@/lib/supabase";

import {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  sanitizeFileName,
  validateMagicBytes,
} from "@/lib/fileValidation";
import { isValidStatus } from "@/lib/validators";

export async function submitTask(weekId, formData) {
  const user = await getUser();
  if (!user || user.role !== "STUDENT") return { error: "Unauthorized" };

  const initialStatus = "PENDING";
  if (!isValidStatus(initialStatus)) {
    return { error: "Invalid status." };
  }

  const screenshot = formData.get("screenshot");
  const taskLinkOrCode = formData.get("taskLinkOrCode")?.toString().trim();

  if (!screenshot || !taskLinkOrCode) {
    return { error: "Screenshot and task details are required." };
  }

  if (!(screenshot instanceof File)) {
    return { error: "Please attach a valid screenshot." };
  }

  if (!ALLOWED_MIME_TYPES.has(screenshot.type)) {
    return { error: "Only PDF, JPG, JPEG, or PNG files are allowed." };
  }

  if (screenshot.size > MAX_FILE_SIZE) {
    return { error: "File must be 3MB or smaller." };
  }

  const bytes = await screenshot.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const detectedMimeType = validateMagicBytes(buffer);
  if (!detectedMimeType) {
    return { error: "Only PDF, JPG, JPEG, or PNG files are allowed." };
  }

  const filename = `${user.id}-${weekId}-${Date.now()}-${sanitizeFileName(screenshot.name)}`;
  const filePath = `${user.id}/${weekId}/${filename}`;

  if (!supabase) {
    return { error: "Supabase storage is not configured." };
  }

  // Upload to Supabase Storage bucket 'submission-uploads'
  const { error: uploadError } = await supabase.storage.from('submission-uploads').upload(filePath, buffer, { upsert: true, contentType: screenshot.type });
  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }
  // Get public URL (bucket is public)
  const { data: { publicUrl } } = supabase.storage.from('submission-uploads').getPublicUrl(filePath);
  const screenshotUrl = publicUrl;

  const existing = await prisma.submission.findFirst({
    where: { studentId: user.id, weekId },
  });

  if (existing) {
    await prisma.submission.update({
      where: { id: existing.id },
      data: {
        screenshotUrl,
        taskLinkOrCode,
        status: "PENDING",
        submittedAt: new Date(),
      },
    });
  } else {
    await prisma.submission.create({
      data: {
        studentId: user.id,
        weekId,
        screenshotUrl,
        taskLinkOrCode,
        status: "PENDING",
      },
    });
  }

  redirect("/student/dashboard");
}
