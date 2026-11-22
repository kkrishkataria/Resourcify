import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, DEMO_PROFILES } from '../context/AuthContext.jsx';
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
  const { user, switchProfile, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Main Nav */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-campus-800 flex items-center justify-center text-white shadow-sm shadow-campus-800/20">
                <CalendarCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900">Campus<span className="text-campus-800">Slot</span></span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                  ResourSync Cloud
                </span>
              </div>
            </Link>

            <div className="hidden md:flex space-x-1">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard') ? 'bg-campus-50 text-campus-800 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </Link>

              <Link
                to="/resources"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/resources') ? 'bg-campus-50 text-campus-800 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Browse Resources
              </Link>

              <Link
                to="/auto-allocate"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  isActive('/auto-allocate') ? 'bg-campus-50 text-campus-800 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-campus-600" />
                <span>Auto-Allocate</span>
              </Link>

              <Link
                to="/my-bookings"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/my-bookings') ? 'bg-campus-50 text-campus-800 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                My Bookings
              </Link>

              {isAdmin && (
                <div className="flex space-x-1 pl-2 border-l border-slate-200">
                  <Link
                    to="/admin/analytics"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin/analytics') ? 'bg-campus-50 text-campus-800 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Admin Analytics
                  </Link>

                  <Link
                    to="/admin/resources"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin/resources') ? 'bg-campus-50 text-campus-800 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Manage Resources
                  </Link>

                  <Link
                    to="/admin/bookings"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin/bookings') ? 'bg-campus-50 text-campus-800 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    All Bookings
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* User Profile & Role Switcher */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-left transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                  {user?.name?.slice(0, 2).toUpperCase() || 'CS'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.name || 'Guest User'}</p>
                  <span
                    className={`inline-block px-1.5 py-0.2 text-[10px] font-bold rounded uppercase ${
                      user?.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : user?.role === 'FACULTY'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {user?.role || 'STUDENT'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Fast Role Switcher Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Role Profile</p>
                    <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>

                  <div className="px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Switch Role (Demo Mode)
                    </p>
                    <div className="space-y-1">
                      {DEMO_PROFILES.map((profile) => (
                        <button
                          key={profile.id}
                          onClick={() => {
                            switchProfile(profile);
                            setProfileDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            user?.id === profile.id ? 'bg-campus-50 text-campus-900 font-semibold border border-campus-200' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <span className="block font-medium">{profile.name}</span>
                            <span className="text-[10px] text-slate-400">{profile.role}</span>
                          </div>
                          {user?.id === profile.id && (
                            <span className="w-2 h-2 rounded-full bg-campus-600"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 mt-1 pt-1 px-3">
                    <Link
                      to="/login"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Switch / Register New User</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
