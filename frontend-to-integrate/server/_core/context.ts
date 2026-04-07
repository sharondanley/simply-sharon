import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/** Synthetic User object for the local admin account (no DB row needed). */
const LOCAL_ADMIN_USER: User = {
  id: 0,
  openId: "local:admin",
  name: "Admin",
  email: null,
  loginMethod: "local",
  role: "admin",
  createdAt: new Date(0),
  updatedAt: new Date(0),
  lastSignedIn: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const session = await sdk.getSessionFromRequest(opts.req);
    if (session?.openId === "local:admin") {
      // Local admin session — no Manus OAuth lookup needed.
      user = { ...LOCAL_ADMIN_USER, lastSignedIn: new Date() };
    } else {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
