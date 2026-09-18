// src/lib/auth.js

import { redirect } from "next/navigation";
import { getUser } from "@/app/actions";

export async function requireRole(role) {
  const user = await getUser();
  if (!user || user.role !== role) {
    redirect("/");
  }
  return user;
}
