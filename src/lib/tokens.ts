import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function createToken(
  userId: string,
  type: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
  expiresInHours: number = 24
) {
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

  // Invalidate any existing tokens of this type for the user
  await prisma.token.updateMany({
    where: { userId, type, used: false },
    data: { used: true },
  })

  const created = await prisma.token.create({
    data: {
      token,
      type,
      expiresAt,
      userId,
    },
  })

  return created.token
}

export async function verifyToken(
  tokenValue: string,
  type: "EMAIL_VERIFICATION" | "PASSWORD_RESET"
) {
  const token = await prisma.token.findFirst({
    where: {
      token: tokenValue,
      type,
      used: false,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  })

  if (!token) return null

  // Mark as used
  await prisma.token.update({
    where: { id: token.id },
    data: { used: true },
  })

  return token
}
