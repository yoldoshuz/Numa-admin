import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_KEY } from "./lib/constants";

export const middleware = (request: NextRequest) => {
  const token = request.cookies.get(TOKEN_KEY)?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/login";
  const isProtected =
    pathname.startsWith("/admin") || pathname.startsWith("/super-admin");

  if (!token && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/super-admin/:path*"],
};
