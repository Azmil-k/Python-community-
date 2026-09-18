"use server";

import { getUser } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateBio(formDataOrText) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  let rawBio = "";
  if (formDataOrText instanceof FormData) {
    rawBio = formDataOrText.get("bio")?.toString() || "";
  } else if (typeof formDataOrText === "string") {
    rawBio = formDataOrText;
  }

  const bio = rawBio.trim().slice(0, 500);

  await prisma.user.update({
    where: { id: user.id },
    data: { bio },
  });

  revalidatePath("/student/profile");
  return { success: true, bio };
}
