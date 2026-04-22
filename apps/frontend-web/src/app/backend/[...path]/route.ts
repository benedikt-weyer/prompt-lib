import type { NextRequest } from "next/server";

const backendUrl = process.env.API_URL ?? "http://localhost:4000";

export const dynamic = "force-dynamic";

function buildTargetUrl(request: NextRequest, path: string[]) {
  const targetUrl = new URL(path.join("/"), `${backendUrl.replace(/\/$/, "")}/`);

  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  return targetUrl;
}

async function proxyRequest(request: NextRequest, path: string[]) {
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const upstreamRequestInit: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };

  if (request.body !== null && request.method !== "GET" && request.method !== "HEAD") {
    upstreamRequestInit.body = request.body;
    upstreamRequestInit.duplex = "half";
  }

  const upstreamResponse = await fetch(buildTargetUrl(request, path), upstreamRequestInit);

  const responseHeaders = new Headers(upstreamResponse.headers);

  responseHeaders.delete("content-length");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}