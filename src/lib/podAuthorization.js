import { prisma } from "@/lib/prisma";

/**
 * Verifies if a mentor user manages the pod that a student belongs to.
 * 
 * @param {object} user The current authenticated mentor user object (must include managedPods).
 * @param {string|object} studentOrId The student's ID string or student object (containing podId).
 * @returns {Promise<boolean>} True if mentor manages the student's pod, false otherwise.
 */
export async function verifyMentorOwnsStudent(user, studentOrId) {
  if (!user || user.role !== "MENTOR") {
    return false;
  }

  let student = studentOrId;
  if (typeof studentOrId === "string") {
    student = await prisma.user.findUnique({
      where: { id: studentOrId },
      select: { podId: true },
    });
  }

  if (!student || !student.podId) {
    return false;
  }

  const managedPodIds = (user.managedPods || []).map((p) => p.id);
  return managedPodIds.includes(student.podId);
}
