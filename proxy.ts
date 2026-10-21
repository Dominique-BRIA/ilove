import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ADMIN, sessionValide } from "@/lib/session";

// Premier filtre de la plateforme de contrôle. Chaque page et chaque action
// d'administration revérifie la session : le proxy ne couvre pas les actions serveur.
export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/admin/connexion") return NextResponse.next();
  if (!(await sessionValide(req.cookies.get(COOKIE_ADMIN)?.value))) {
    return NextResponse.redirect(new URL("/admin/connexion", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
