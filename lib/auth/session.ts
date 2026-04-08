import { getSession, type JwtPayload } from "./jwt";
import { redirect } from "next/navigation";

export async function requireAuth(): Promise<JwtPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
