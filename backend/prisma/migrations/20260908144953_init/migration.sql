-- CreateEnum
CREATE TYPE "MonitorStatus" AS ENUM ('Healthy', 'Down');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('Open', 'Resolved');

-- CreateTable
CREATE TABLE "Monitor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 5,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "status" "MonitorStatus" NOT NULL DEFAULT 'Healthy',
    "responseTime" INTEGER,
    "statusCode" INTEGER,
    "lastChecked" TIMESTAMP(3),
    "totalChecks" INTEGER NOT NULL DEFAULT 0,
    "successChecks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" SERIAL NOT NULL,
    "monitorId" INTEGER NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'Open',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckLog" (
    "id" SERIAL NOT NULL,
    "monitorId" INTEGER NOT NULL,
    "latency" INTEGER,
    "statusCode" INTEGER,
    "status" "MonitorStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckLog" ADD CONSTRAINT "CheckLog_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
