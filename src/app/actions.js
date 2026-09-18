"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { setSession, getSession, clearSession } from "@/lib/session";

// In-memory login rate limiter
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(key) {
  const attempt = loginAttempts.get(key);
  if (attempt) {
    if (attempt.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((attempt.lockUntil - Date.now()) / 1000 / 60);
      return { limited: true, reason: `Too many failed attempts. Try again in ${remainingTime} minutes.` };
    }
    if (attempt.lockUntil <= Date.now() && attempt.count >= MAX_ATTEMPTS) {
      loginAttempts.delete(key);
    }
  }
  return { limited: false };
}

function recordFailedAttempt(key) {
  const attempt = loginAttempts.get(key) || { count: 0, lockUntil: 0 };
  attempt.count += 1;
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockUntil = Date.now() + LOCK_TIME;
  }
  loginAttempts.set(key, attempt);
}

function recordSuccessfulAttempt(key) {
  loginAttempts.delete(key);
}

export async function loginUser(email, password) {
  const headersStore = await headers();
  const ip = headersStore.get("x-forwarded-for") || "unknown-ip";

  const emailClean = (email || "").toString().trim().toLowerCase();

  // Rate limit checks
  const emailLimit = checkRateLimit(emailClean);
  if (emailLimit.limited) {
    return { error: emailLimit.reason };
  }
  const ipLimit = checkRateLimit(ip);
  if (ipLimit.limited) {
    return { error: ipLimit.reason };
  }

  const user = await prisma.user.findUnique({
    where: { email: emailClean },
  });

  if (!user?.password) {
    recordFailedAttempt(emailClean);
    recordFailedAttempt(ip);
    return { error: "Invalid credentials. Please contact admin." };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    recordFailedAttempt(emailClean);
    recordFailedAttempt(ip);
    return { error: "Invalid credentials. Please contact admin." };
  }

  // Clear attempts on success
  recordSuccessfulAttempt(emailClean);
  recordSuccessfulAttempt(ip);

  // Set the signed JWT session
  await setSession(user.id, user.role);

  if (user.role === "ADMIN") {
    redirect("/admin/dashboard");
  } else if (user.role === "MENTOR") {
    redirect("/mentor/review");
  } else {
    redirect("/student/dashboard");
  }
}

export async function getUser() {
  const session = await getSession();
  if (!session || !session.userId) return null;

  return await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      pod: true,
      managedPods: true,
    },
  });
}

export async function getLatestAnnouncement() {
  return prisma.announcement.findFirst({
    orderBy: { createdAt: "desc" },
  });
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function changePassword(currentPassword, newPassword) {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  if (!currentPassword || typeof currentPassword !== "string") {
    return { error: "Current password is required." };
  }

  if (!user.password) {
    return { error: "Current password is incorrect." };
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    return { error: "Current password is incorrect." };
  }

  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    return { error: "New password must be at least 8 characters long." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return { success: true };
}

