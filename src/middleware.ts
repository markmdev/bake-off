import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes - skip auth check entirely
  if (
    path === '/' ||
    path === '/landing' ||
    path === '/login' ||
    path === '/signup' ||
    path.startsWith('/api/webhooks') ||
    path.startsWith('/api/agent/') ||
    path.startsWith('/api/skill/')
  ) {
    return NextResponse.next();
  }

  // For protected routes, check Supabase auth
  let supabaseResponse = NextResponse.next({
    request,
  });

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Dashboard routes require authentication
  if (
    path.startsWith('/dashboard') ||
    path.startsWith('/tasks') ||
    path.startsWith('/agents') ||
    path.startsWith('/settings')
  ) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // API routes (except agent, webhooks, auth, and skill) require authentication
  if (path.startsWith('/api/') && !path.startsWith('/api/agent/') && !path.startsWith('/api/webhooks') && !path.startsWith('/api/auth/') && !path.startsWith('/api/skill/')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
