import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface HealthCheck {
  status: "ok" | "error"
  timestamp: string
  version: string
  checks: {
    database: "ok" | "error"
    uptime: number
  }
  error?: string
}

const startTime = Date.now()

export async function GET() {
  const health: HealthCheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    checks: {
      database: "ok",
      uptime: Math.floor((Date.now() - startTime) / 1000),
    },
  }

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    health.checks.database = "ok"
  } catch (error) {
    health.status = "error"
    health.checks.database = "error"
    health.error = error instanceof Error ? error.message : "Database connection failed"

    return NextResponse.json(health, { status: 503 })
  }

  return NextResponse.json(health, { status: 200 })
}
