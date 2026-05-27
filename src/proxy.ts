import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

// Simple in-memory rate limit maps
// Note: In a serverless environment like Vercel, this is per-isolate.
// For true global rate limiting, a service like Upstash Redis is recommended.
const generalLimitMap = new Map<string, { count: number, timestamp: number }>();
const sensitiveLimitMap = new Map<string, { count: number, timestamp: number }>();

const LIMITS = {
  GENERAL: { max: 100, window: 60 * 1000 },   // 100 req/min for reads
  SENSITIVE: { max: 10, window: 60 * 1000 },  // 10 req/min for checkout, logs, bugs, profile, progress
};

function isSensitiveRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/api/checkout/') ||
    pathname.startsWith('/api/bugs') ||
    pathname.startsWith('/api/logs') ||
    pathname.startsWith('/api/upload') ||
    pathname.startsWith('/api/profile') ||
    pathname.startsWith('/api/progress') ||
    pathname.startsWith('/api/admin/')
  );
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  // Only apply rate limiting to API routes to avoid blocking static assets
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    if (ip !== 'unknown') {
      const now = Date.now();
      const pathname = request.nextUrl.pathname;
      const isSensitive = isSensitiveRoute(pathname);
      
      const limitConfig = isSensitive ? LIMITS.SENSITIVE : LIMITS.GENERAL;
      const rateLimitMap = isSensitive ? sensitiveLimitMap : generalLimitMap;
      
      const ipData = rateLimitMap.get(ip);
      
      if (!ipData || now - ipData.timestamp > limitConfig.window) {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
      } else {
        if (ipData.count >= limitConfig.max) {
          return new NextResponse(
            JSON.stringify({ 
              error: 'Too Many Requests', 
              message: isSensitive 
                ? 'Rate limit exceeded for sensitive actions. Please try again in a minute.' 
                : 'Rate limit exceeded.' 
            }),
            { 
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': Math.ceil((limitConfig.window - (now - ipData.timestamp)) / 1000).toString()
              }
            }
          );
        }
        ipData.count++;
        rateLimitMap.set(ip, ipData);
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
    pathname === '/login' ||
    pathname === '/signin' || 
    pathname === '/about' || 
    pathname === '/privacy' || 
    pathname === '/contact' || 
    pathname === '/features' || 
    pathname === '/upgrade' ||
    pathname === '/upgrade/success' ||
    pathname === '/journey' ||
    pathname === '/leaderboard' ||
    pathname.startsWith('/api/');

  let user = null;
  try {
    if (isPublicRoute) {
      const { data } = await supabase.auth.getSession();
      user = data.session?.user;
    } else {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
  } catch (e) {
    // If auth check fails (cookie issue, network error), allow the request through.
    // Client-side auth (AuthContext) will handle access control gracefully.
    console.warn("Proxy auth check failed, allowing request through:", e);
    return supabaseResponse;
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
