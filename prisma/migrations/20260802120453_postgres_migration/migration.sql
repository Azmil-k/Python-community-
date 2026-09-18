-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "podId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mentorId" TEXT,

    CONSTRAINT "Pod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Week" (
    "id" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "targetModule" TEXT NOT NULL,
    "taskBrief" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Week_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "screenshotUrl" TEXT NOT NULL,
    "taskLinkOrCode" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "mentorComment" TEXT,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateAwarded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,

    CONSTRAINT "ExtraTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignedExtraTask" (
    "id" TEXT NOT NULL,
    "podId" TEXT NOT NULL,
    "extraTaskId" TEXT NOT NULL,

    CONSTRAINT "AssignedExtraTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraTaskSubmission" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "extraTaskId" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "screenshotUrl" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "mentorComment" TEXT,

    CONSTRAINT "ExtraTaskSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Week_weekNumber_key" ON "Week"("weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_studentId_name_key" ON "Badge"("studentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AssignedExtraTask_podId_extraTaskId_key" ON "AssignedExtraTask"("podId", "extraTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtraTaskSubmission_studentId_extraTaskId_key" ON "ExtraTaskSubmission"("studentId", "extraTaskId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_podId_fkey" FOREIGN KEY ("podId") REFERENCES "Pod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pod" ADD CONSTRAINT "Pod_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraTask" ADD CONSTRAINT "ExtraTask_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedExtraTask" ADD CONSTRAINT "AssignedExtraTask_podId_fkey" FOREIGN KEY ("podId") REFERENCES "Pod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedExtraTask" ADD CONSTRAINT "AssignedExtraTask_extraTaskId_fkey" FOREIGN KEY ("extraTaskId") REFERENCES "ExtraTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraTaskSubmission" ADD CONSTRAINT "ExtraTaskSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraTaskSubmission" ADD CONSTRAINT "ExtraTaskSubmission_extraTaskId_fkey" FOREIGN KEY ("extraTaskId") REFERENCES "ExtraTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
