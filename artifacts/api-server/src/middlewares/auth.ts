import type { NextFunction, Request, Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import { db, sessoesTable, usuariosTable, type Usuario } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      currentUser?: Usuario;
      sessionToken?: string;
    }
  }
}

export function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export async function loadUserFromToken(
  token: string,
): Promise<Usuario | null> {
  const [row] = await db
    .select({ user: usuariosTable })
    .from(sessoesTable)
    .innerJoin(usuariosTable, eq(sessoesTable.userId, usuariosTable.id))
    .where(
      and(eq(sessoesTable.token, token), gt(sessoesTable.expiresAt, new Date())),
    );
  return row?.user ?? null;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  const user = await loadUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: "Sessão inválida ou expirada" });
    return;
  }
  req.currentUser = user;
  req.sessionToken = token;
  next();
}
