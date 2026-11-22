import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  CalendarCheck,
  Building2,
  Sparkles,
  ClipboardList,
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronDown,
  Layers,
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
        <div className="flex justify-between h-16">
          {/* Logo & Main Nav */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-thapar-800 flex items-center justify-center text-white shadow-sm shadow-thapar-800/20">
                <CalendarCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900">
                    Resourcify
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold bg-thapar-100 text-thapar-800 rounded uppercase border border-thapar-200">
                    TIET
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-none">
                  Thapar Institute of Engg & Tech
                </p>
              </div>
            </Link>

            <div className="hidden md:flex space-x-1">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard') ? 'bg-thapar-50 text-thapar-800 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </Link>

              <Link
                to="/resources"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/resources') ? 'bg-thapar-50 text-thapar-800 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Thapar Facilities
              </Link>

              <Link
                to="/auto-allocate"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  isActive('/auto-allocate') ? 'bg-thapar-50 text-thapar-800 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-thapar-600" />
                <span>Auto-Allocate</span>
              </Link>

              <Link
                to="/my-bookings"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/my-bookings') ? 'bg-thapar-50 text-thapar-800 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                My Reservations
              </Link>

              {isAdmin && (
                <div className="flex space-x-1 pl-2 border-l border-slate-200">
                  <Link
                    to="/admin/analytics"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin/analytics') ? 'bg-thapar-50 text-thapar-800 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Campus Analytics
                  </Link>

                  <Link
                    to="/admin/resources"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin/resources') ? 'bg-thapar-50 text-thapar-800 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Manage Venues
                  </Link>

                  <Link
                    to="/admin/bookings"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin/bookings') ? 'bg-thapar-50 text-thapar-800 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    All Bookings
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* User Profile & Session Controls */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-left transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-thapar-50 border border-thapar-200 flex items-center justify-center font-bold text-xs text-thapar-800">
                    {user?.name?.slice(0, 2).toUpperCase() || 'TI'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.name}</p>
                    <span
                      className={`inline-block px-1.5 py-0.2 text-[10px] font-bold rounded uppercase ${
                        user?.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : user?.role === 'FACULTY'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {user?.role}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Signed In As</p>
                      <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      <p className="text-[10px] text-thapar-800 font-semibold mt-0.5">{user?.department}</p>
                    </div>

                    <div className="px-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors"
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
