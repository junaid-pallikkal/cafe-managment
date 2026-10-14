"use server";

import { prisma } from "@/lib/db";
import { comparePassword, setSessionCookie, clearSessionCookie, getCurrentUser } from "@/lib/auth/session";
import { LoginSchema } from "@/lib/validations/schemas";
import { ActionResult, getDefaultRouteForRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

export async function loginAction(
  prevState: ActionResult<{ redirectUrl: string }> | null,
  formData: FormData
): Promise<ActionResult<{ redirectUrl: string }>> {
  const rawData = {
    emailOrUsername: formData.get("emailOrUsername") as string,
    password: formData.get("password") as string,
  };

  const parsed = LoginSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid credentials format",
    };
  }

  const { emailOrUsername, password } = parsed.data;

  // Find user by email or case-insensitive match
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: emailOrUsername, mode: "insensitive" } },
        { name: { equals: emailOrUsername, mode: "insensitive" } },
      ],
    },
  });

  if (!user) {
    return { success: false, error: "Invalid username/email or password" };
  }

  if (!user.isActive) {
    return { success: false, error: "Your account is deactivated. Contact Admin." };
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, error: "Invalid username/email or password" };
  }

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  const redirectUrl = getDefaultRouteForRole(user.role);
  return { success: true, data: { redirectUrl } };
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

export async function getSessionUserAction() {
  return await getCurrentUser();
}
