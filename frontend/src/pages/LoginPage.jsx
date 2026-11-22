import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_PROFILES } from '../context/AuthContext.jsx';
import { CalendarCheck, ShieldCheck, GraduationCap, Briefcase, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { switchProfile, loginWithCredentials, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');

  const handleDemoSelect = (profile) => {
    switchProfile(profile);
    if (profile.role === 'ADMIN') {
      navigate('/admin/analytics');
    } else {
      navigate('/dashboard');
    }
  };

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    setError('');
    const res = await loginWithCredentials(email, role);
    if (res.success) {
      if (role === 'ADMIN') {
        navigate('/admin/analytics');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-campus-800 text-white flex items-center justify-center mx-auto shadow-lg shadow-campus-800/25">
          <CalendarCheck className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">CampusSlot</h2>
        <p className="mt-1 text-sm text-slate-500">
          Intelligent Campus Resource Booking & Auto-Allocation Cloud System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {/* Quick Demo Sign In */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Instant One-Click Login (Role-Based Demo)
            </label>
            <div className="space-y-2">
              {DEMO_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleDemoSelect(profile)}
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-campus-400 hover:bg-slate-50 transition-all text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        profile.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : profile.role === 'FACULTY'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {profile.role === 'ADMIN' ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : profile.role === 'FACULTY' ? (
                        <Briefcase className="w-5 h-5" />
                      ) : (
                        <GraduationCap className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-campus-900">
                        {profile.name}
                      </p>
                      <p className="text-xs text-slate-400">{profile.role} • {profile.department.split('&')[0]}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-campus-600 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">or sign in with email</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Custom Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@campusslot.edu"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role Designation</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800 text-sm bg-white"
              >
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty Member</option>
                <option value="ADMIN">Campus Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-campus-800 hover:bg-campus-900 text-white font-semibold text-sm shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-campus-800/50"
            >
              {loading ? 'Authenticating...' : 'Sign In to CampusSlot'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
