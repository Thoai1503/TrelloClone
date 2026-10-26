import { NextResponse, type NextRequest } from "next/server";

const sensitiveHeaderNames = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
]);
const sensitiveQueryParameterPattern = /token|password|secret|api[-_]?key|auth|code/i;

export function proxy(request: NextRequest) {
  const headers = Object.fromEntries(
    [...request.headers.entries()].map(([name, value]) => [
      name,
      sensitiveHeaderNames.has(name.toLowerCase()) ? "[REDACTED]" : value,
    ]),
  );
  const url = new URL(request.url);

  for (const key of url.searchParams.keys()) {
    if (sensitiveQueryParameterPattern.test(key)) {
      url.searchParams.set(key, "[REDACTED]");
    }
  }

  console.info(
    "[HTTP request]",
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        method: request.method,
        url: url.toString(),
        pathname: request.nextUrl.pathname,
        query: Object.fromEntries(url.searchParams.entries()),
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: request.headers.get("user-agent"),
        headers,
      },
      null,
      2,
    ),
  );

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
