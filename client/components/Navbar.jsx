'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '../store/useAuthStore';
import { LayoutDashboard, Briefcase, Users, GitFork, BarChart3, LogOut, ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, initialize, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Do not render navbar on public pages
  const isPublicPage = pathname.startsWith('/jobs/');
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isPublicPage || isAuthPage) return null;

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', path: '/dashboard/jobs', icon: Briefcase },
    { name: 'Candidates', path: '/dashboard/candidates', icon: Users },
    { name: 'Workflows', path: '/dashboard/workflows', icon: GitFork },
    { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 }
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex shrink-0 items-center">
              <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-blue-600">
                <GitFork className="h-6 w-6 stroke-[2.5]" />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AgentHire</span>
              </Link>
            </div>
            
            {isAuthenticated && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      <Icon className="mr-1.5 h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-red-600 transition-all border border-transparent hover:border-slate-200"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              !loading && !isAuthenticated && (
                <Link
                  href="/login"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Recruiter Sign In
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
