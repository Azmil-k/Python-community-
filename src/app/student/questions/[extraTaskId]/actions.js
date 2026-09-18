"use server";

import { getUser } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import supabase from "@/lib/supabase";
import { revalidatePath } from "next/cache";

import {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  sanitizeFileName,
  validateMagicBytes,
} from "@/lib/fileValidation";
import { isValidStatus } from "@/lib/validators";

export async function submitExtraTaskAnswer(extraTaskId, formData) {
  const user = await getUser();
  if (!user || user.role !== "STUDENT") return { error: "Unauthorized" };

  const initialStatus = "PENDING";
  if (!isValidStatus(initialStatus)) {
    return { error: "Invalid status." };
  }

  // Verify the task exists and is assigned to the student's pod
  const extraTask = await prisma.extraTask.findUnique({
    where: { id: extraTaskId },
    include: { assignments: true },
  });

  if (!extraTask) {
    return { error: "Bonus question not found." };
  }

  const isAssigned = extraTask.assignments.some(
    (assignment) => assignment.podId === user.podId
  );
  if (!isAssigned) {
    return { error: "This bonus question is not assigned to your pod." };
  }

  const answerText = formData.get("answerText")?.toString().trim();
  if (!answerText) {
    return { error: "Answer text is required." };
  }

  const screenshot = formData.get("screenshot");
  const hasScreenshot = screenshot && (screenshot instanceof File) && screenshot.size > 0;

  let screenshotUrl = null;

  // Retrieve existing submission to preserve the screenshot if they edit text and don't re-upload
  const existing = await prisma.extraTaskSubmission.findUnique({
    where: {
      studentId_extraTaskId: {
        studentId: user.id,
        extraTaskId,
      },
    },
  });

  if (hasScreenshot) {
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

    const filename = `extra-${user.id}-${extraTaskId}-${Date.now()}-${sanitizeFileName(screenshot.name)}`;
    const filePath = `${user.id}/${extraTaskId}/${filename}`;

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
    screenshotUrl = publicUrl;
  } else {
    // Keep old screenshot if exists
    screenshotUrl = existing ? existing.screenshotUrl : null;
  }

  await prisma.extraTaskSubmission.upsert({
    where: {
      studentId_extraTaskId: {
        studentId: user.id,
        extraTaskId,
      },
    },
    update: {
      answerText,
      screenshotUrl,
      status: "PENDING",
      submittedAt: new Date(),
    },
    create: {
      studentId: user.id,
      extraTaskId,
      answerText,
      screenshotUrl,
      status: "PENDING",
    },
  });

  revalidatePath("/student/dashboard");
  revalidatePath("/student/progress");
  revalidatePath("/mentor/review");

  redirect("/student/dashboard");
}
