import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const userId = request.cookies.get('userId')?.value;
    const isOnboarded = request.cookies.get('isOnboarded')?.value === 'true';

    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/register';
    const isOnboardingPage = pathname === '/onboarding';
    const isAgentPage = pathname.startsWith('/agent');

    // 1. User is logged in
    if (userId) {
        if (isAuthPage) {
            if (!isOnboarded) {
                return NextResponse.redirect(new URL('/onboarding', request.url));
            } else {
                return NextResponse.redirect(new URL('/agent', request.url));
            }
        }

        if (isAgentPage && !isOnboarded) {
            return NextResponse.redirect(new URL('/onboarding', request.url));
        }

        if (isOnboardingPage && isOnboarded) {
            return NextResponse.redirect(new URL('/agent', request.url));
        }
    } 
    // 2. User is NOT logged in
    else {
        if (isAgentPage || isOnboardingPage || pathname === '/') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
