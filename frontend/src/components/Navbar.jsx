import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  CalendarCheck,
  Building2,
  Sparkles,
  ClipboardList,
  BarChart3,
  LayoutGrid,
  Eye,
  LogOut,
  ChevronDown,
  Shield,
  ArrowRightLeft,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to={isAdmin ? '/admin/analytics' : '/dashboard'}
              className="flex items-center space-x-2.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-thapar-800 flex items-center justify-center text-white shadow-sm shadow-thapar-800/20 group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xl font-black tracking-tight text-slate-900">
                    Resourcify
                  </span>
                  {isAdmin ? (
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-purple-100 text-purple-900 rounded uppercase border border-purple-200 tracking-wider">
                      ADMIN
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-thapar-100 text-thapar-800 rounded uppercase border border-thapar-200">
                      TIET
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-none">
                  {isAdmin ? 'Estate & Facilities Console' : 'Thapar Institute of Engg & Tech'}
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links (Tailored for Role) */}
          <div className="hidden md:flex items-center space-x-1 no-scrollbar">
            {isAdmin ? (
              /* ADMIN SPECIFIC NAVIGATION */
              <>
                <Link
                  to="/admin/analytics"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 flex items-center space-x-1.5 transition-all ${
                    isActive('/admin/analytics')
                      ? 'bg-thapar-50 text-thapar-800 font-bold border border-thapar-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Campus Analytics</span>
                </Link>

                <Link
                  to="/admin/resources"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 flex items-center space-x-1.5 transition-all ${
                    isActive('/admin/resources')
                      ? 'bg-thapar-50 text-thapar-800 font-bold border border-thapar-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Manage Venues</span>
                </Link>

                <Link
                  to="/admin/bookings"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 flex items-center space-x-1.5 transition-all ${
                    isActive('/admin/bookings')
                      ? 'bg-thapar-50 text-thapar-800 font-bold border border-thapar-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>All Bookings</span>
                </Link>

                <Link
                  to="/auto-allocate"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 flex items-center space-x-1.5 transition-all ${
                    isActive('/auto-allocate')
                      ? 'bg-thapar-50 text-thapar-800 font-bold border border-thapar-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Auto-Allocate</span>
                </Link>

                <Link
                  to="/resources"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 flex items-center space-x-1.5 transition-all ${
                    isActive('/resources')
                      ? 'bg-thapar-50 text-thapar-800 font-bold border border-thapar-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Browse Venues</span>
                </Link>

                {/* Quick Toggle to Preview Student Portal */}
                <div className="pl-2 border-l border-slate-200">
                  <Link
                    to="/dashboard"
                    title="Switch to Student / Faculty Dashboard"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 flex items-center space-x-1.5 transition-all border ${
                      isActive('/dashboard')
                        ? 'bg-purple-50 text-purple-800 border-purple-200 font-bold'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-600" />
                    <span>Student View</span>
                  </Link>
                </div>
              </>
            ) : (
              /* STUDENT & FACULTY NAVIGATION */
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-thapar-50 text-thapar-800 font-bold border border-thapar-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </Link>

                <Link
                  to="/resources"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    isActive('/resources')
                      ? 'bg-thapar-50 text-thapar-800 font-bold border border-thapar-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Thapar Facilities
                </Link>

                <Link
                  to="/auto-allocate"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 flex items-center space-x-1.5 transition-colors ${
                    isActive('/auto-allocate')
                      ? 'bg-thapar-50 text-thapar-800 font-bold border border-thapar-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Auto-Allocate</span>
                </Link>

                <Link
                  to="/my-bookings"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    isActive('/my-bookings')
                      ? 'bg-thapar-50 text-thapar-800 font-bold border border-thapar-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My Reservations
                </Link>
              </>
            )}
          </div>

          {/* User Profile & Session Controls */}
          <div className="flex items-center space-x-3 shrink-0">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-left transition-all cursor-pointer shadow-2xs"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isAdmin
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : user?.role === 'FACULTY'
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    {user?.name?.slice(0, 2).toUpperCase() || 'TI'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p
                      className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]"
                      title={user?.name}
                    >
                      {user?.name}
                    </p>
                    <span
                      className={`inline-block px-1.5 py-0.2 text-[9px] font-extrabold rounded uppercase tracking-wider ${
                        user?.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : user?.role === 'FACULTY'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {user?.role === 'ADMIN' ? 'ESTATE ADMIN' : user?.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Signed In As
                      </p>
                      <p className="text-sm font-bold text-slate-800 leading-tight mt-0.5">
                        {user?.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                      <p className="text-[10px] text-thapar-800 font-semibold mt-1">
                        {user?.department}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="px-2 py-1.5 border-b border-slate-100 space-y-0.5">
                        <Link
                          to="/admin/analytics"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-thapar-800"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                          <span>Campus Analytics</span>
                        </Link>
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-thapar-800"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Student Portal View</span>
                        </Link>
                      </div>
                    )}

                    <div className="px-2 pt-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out of TIET Portal</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-thapar-800 hover:bg-thapar-900 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
