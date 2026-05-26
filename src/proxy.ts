import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

// Simple in-memory rate limit map
// Note: In a serverless environment like Vercel, this is per-isolate.
// For true global rate limiting, a service like Upstash Redis is recommended.
const ipRequestMap = new Map<string, { count: number, timestamp: number }>();

const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  // Only apply rate limiting to API routes to avoid blocking static assets
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    if (ip !== 'unknown') {
      const now = Date.now();
      const ipData = ipRequestMap.get(ip);
      
      if (!ipData || now - ipData.timestamp > RATE_LIMIT_WINDOW_MS) {
        ipRequestMap.set(ip, { count: 1, timestamp: now });
      } else {
        if (ipData.count >= RATE_LIMIT_MAX_REQUESTS) {
          return new NextResponse(
            JSON.stringify({ error: 'Too Many Requests', message: 'Rate limit exceeded' }),
            { 
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': Math.ceil((RATE_LIMIT_WINDOW_MS - (now - ipData.timestamp)) / 1000).toString()
              }
            }
          );
        }
        ipData.count++;
        ipRequestMap.set(ip, ipData);
      }
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Route Protection: Enforce Paywall (Home Screen)
  const pathname = request.nextUrl.pathname;
  const isPublicRoute = 
    pathname === '/' || 
    pathname === '/signin' || 
    pathname === '/about' || 
    pathname === '/privacy' || 
    pathname === '/contact' || 
    pathname === '/features' || 
    pathname.startsWith('/api/');

  let user = null;
  if (isPublicRoute) {
    const { data } = await supabase.auth.getSession();
    user = data.session?.user;
  } else {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (pathname === '/login') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  // Log visitor access asynchronously
  if (!pathname.startsWith('/api/')) {
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const requestId = crypto.randomUUID();
    
    // Manage unique visitor cookie for tracking returning anonymous users
    let visitorId = request.cookies.get('vocabpod_visitor_id')?.value;
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      supabaseResponse.cookies.set('vocabpod_visitor_id', visitorId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }

    event.waitUntil(
      (async () => {
        const { error } = await supabase.from('application_logs').insert({
          level: 'INFO',
          category: 'VISITOR',
          message: `Page view: ${pathname}`,
          user_id: user?.id || null,
          request_id: requestId,
          metadata: {
            ip,
            userAgent,
            pathname,
            visitorId
          }
        });
        if (error) console.error("Visitor logging error:", error);
      })()
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)",
  ],
};
