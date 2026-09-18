import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/apiAuth";

export async function GET(request) {
  const userOrRes = await requireApiUser();
  if (userOrRes instanceof Response) return userOrRes;
  const user = userOrRes;

  let extraTasks = [];

  if (user.role === "STUDENT") {
    if (user.podId) {
      extraTasks = await prisma.extraTask.findMany({
        where: {
          assignments: {
            some: {
              podId: user.podId,
            },
          },
        },
        include: { assignments: true },
        orderBy: { weekId: "desc" },
      });
    }
  } else if (user.role === "MENTOR") {
    const managedPodIds = user.managedPods.map((p) => p.id);
    extraTasks = await prisma.extraTask.findMany({
      where: {
        assignments: {
          some: {
            podId: { in: managedPodIds },
          },
        },
      },
      include: { assignments: true },
      orderBy: { weekId: "desc" },
    });
  } else if (user.role === "ADMIN") {
    extraTasks = await prisma.extraTask.findMany({
      include: { assignments: true },
      orderBy: { weekId: "desc" },
    });
  }

  return new Response(JSON.stringify(extraTasks), { status: 200, headers: { "Content-Type": "application/json" } });
}

export async function POST(request) {
  const userOrRes = await requireApiUser(["ADMIN", "MENTOR"]);
  if (userOrRes instanceof Response) return userOrRes;
  const user = userOrRes;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const { title, description, weekId, podId } = body;

  const titleClean = (title || "").toString().trim();
  const descClean = (description || "").toString().trim();

  if (!titleClean || !weekId) {
    return new Response(JSON.stringify({ error: "Title and weekId are required." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  if (titleClean.length > 100) {
    return new Response(JSON.stringify({ error: "Title must be 100 characters or less." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Validate week exists
  const week = await prisma.week.findUnique({ where: { id: weekId } });
  if (!week) {
    return new Response(JSON.stringify({ error: "Specified week does not exist." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // If mentor, verify podId belongs to their managed pods
  if (user.role === "MENTOR") {
    if (!podId) {
      return new Response(JSON.stringify({ error: "podId is required for mentors." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const managedPodIds = user.managedPods.map((p) => p.id);
    if (!managedPodIds.includes(podId)) {
      return new Response(JSON.stringify({ error: "Forbidden: You do not manage the specified pod." }), { status: 403, headers: { "Content-Type": "application/json" } });
    }
  }

  // If admin, verify podId exists if provided
  if (user.role === "ADMIN" && podId) {
    const targetPod = await prisma.pod.findUnique({ where: { id: podId } });
    if (!targetPod) {
      return new Response(JSON.stringify({ error: "Specified pod does not exist." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
  }

  const newTask = await prisma.extraTask.create({
    data: {
      title: titleClean,
      description: descClean,
      weekId,
      assignments: podId
        ? {
            create: {
              podId,
            },
          }
        : undefined,
    },
    include: { assignments: true },
  });

  return new Response(JSON.stringify(newTask), { status: 201, headers: { "Content-Type": "application/json" } });
}

export async function DELETE(request) {
  const userOrRes = await requireApiUser(["ADMIN", "MENTOR"]);
  if (userOrRes instanceof Response) return userOrRes;
  const user = userOrRes;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const { id } = body;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const extraTask = await prisma.extraTask.findUnique({
    where: { id },
    include: { assignments: true },
  });

  if (!extraTask) {
    return new Response(JSON.stringify({ error: "Task not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  // If mentor, verify task is assigned to a pod they manage, and not assigned to unmanaged pods
  if (user.role === "MENTOR") {
    const managedPodIds = user.managedPods.map((p) => p.id);
    const hasUnownedAssignment = extraTask.assignments.some((a) => !managedPodIds.includes(a.podId));
    if (hasUnownedAssignment || extraTask.assignments.length === 0) {
      return new Response(
        JSON.stringify({ error: "Forbidden: This task is assigned to pods you do not manage." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Delete assignments and extra task in transaction
  await prisma.$transaction([
    prisma.assignedExtraTask.deleteMany({ where: { extraTaskId: id } }),
    prisma.extraTask.delete({ where: { id } }),
  ]);

  return new Response(null, { status: 204 });
}

