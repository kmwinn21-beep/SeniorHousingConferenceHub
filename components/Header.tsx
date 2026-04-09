'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useUser } from './UserContext';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/conferences': 'Conferences',
  '/conferences/new': 'New Conference',
  '/attendees': 'Attendees',
  '/companies': 'Companies',
  '/admin': 'Admin Panel',
  '/follow-ups': 'Follow Ups',
  '/auth/account': 'My Account',
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/conferences/') && pathname.split('/').length === 3) return 'Conference Details';
  if (pathname.startsWith('/attendees/')) return 'Attendee Details';
  if (pathname.startsWith('/companies/')) return 'Company Details';
  return 'Senior Housing Conference Hub';
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, refresh } = useUser();
  const title = getPageTitle(pathname);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      refresh();
      router.push('/auth/login');
      router.refresh();
    } catch {
      toast.error('Logout failed.');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-xl font-semibold text-procare-dark-blue font-serif">{title}</h1>
        <p className="text-xs text-gray-500 hidden sm:block">Senior Housing Conference Hub</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Admin Panel — only visible to administrators */}
        {user?.role === 'administrator' && (
          <Link
            href="/admin"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${pathname === '/admin' ? 'bg-gray-100' : ''}`}
            title="Admin Panel"
          >
            <svg className="w-4 h-4 text-procare-dark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-procare-dark-blue hidden sm:block">Admin</span>
          </Link>
        )}

        {/* User menu */}
        {user && (
          <div className="flex items-center gap-1">
            <Link
              href="/auth/account"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={user.email}
            >
              <div className="w-7 h-7 rounded-full bg-procare-bright-blue flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-procare-dark-blue hidden md:block max-w-[140px] truncate">
                {user.email.split('@')[0]}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-red-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
