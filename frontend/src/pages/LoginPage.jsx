import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, THAPAR_DEMO_ACCOUNTS } from '../context/AuthContext.jsx';
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  CalendarCheck,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('STUDENT');
  const [regDepartment, setRegDepartment] = useState('Computer Science & Engineering (CSED)');
  const [regRollNumber, setRegRollNumber] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fillQuickCredentials = (account) => {
    setActiveTab('login');
    setLoginEmail(account.email);
    setLoginPassword(account.password);
    setErrorMessage('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const res = await login(loginEmail, loginPassword);
    if (res.success) {
      const defaultDest = res.user?.role === 'ADMIN' ? '/admin/analytics' : '/dashboard';
      const fromPath = location.state?.from?.pathname || defaultDest;
      navigate(fromPath, { replace: true });
    } else {
      setErrorMessage(res.error);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    const res = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      department: regDepartment,
      rollNumber: regRollNumber,
    });

    if (res.success) {
      const defaultDest = res.user?.role === 'ADMIN' ? '/admin/analytics' : '/dashboard';
      const fromPath = location.state?.from?.pathname || defaultDest;
      navigate(fromPath, { replace: true });
    } else {
      setErrorMessage(res.error);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-thapar-800 text-white flex items-center justify-center mx-auto shadow-lg shadow-thapar-800/25">
          <CalendarCheck className="w-8 h-8" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
          Resourcify
        </h1>
        <p className="mt-1 text-sm font-semibold text-thapar-800">
          Thapar Institute of Engineering & Technology (TIET)
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Intelligent Campus Facility Booking & Automated Resource Allocation
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {/* Tab Selector: Sign In vs Register */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage('');
              }}
              className={`w-1/2 pb-3 text-sm font-bold text-center border-b-2 transition-colors ${
                activeTab === 'login'
                  ? 'border-thapar-800 text-thapar-800'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage('');
              }}
              className={`w-1/2 pb-3 text-sm font-bold text-center border-b-2 transition-colors ${
                activeTab === 'register'
                  ? 'border-thapar-800 text-thapar-800'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Quick Demo Credentials Assistant */}
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Official Thapar Accounts (Click to Auto-fill)
              </p>
              <span className="text-[10px] font-semibold text-thapar-800 bg-thapar-100 px-2 py-0.5 rounded border border-thapar-200">
                Login via Email or ID
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {THAPAR_DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillQuickCredentials(acc)}
                  className="p-3 rounded-xl bg-white border border-slate-200 hover:border-thapar-800 hover:bg-thapar-50/50 text-left transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-bold text-slate-900 group-hover:text-thapar-800">
                      {acc.roleLabel || acc.role}
                    </span>
                  </div>
                  <span className="block text-[11px] font-semibold text-slate-700 mt-1">{acc.name}</span>
                  <span className="block text-[10px] text-slate-500 font-mono mt-0.5 truncate">{acc.badge || acc.rollNumber}</span>
                  <span className="block text-[9px] text-thapar-800 font-mono truncate">{acc.email}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5 text-center">
              Universal default password: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-800 font-bold">Thapar@2026</code>
            </p>
          </div>

          {location.state?.message && !errorMessage && !successMessage && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center space-x-2.5 shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{location.state.message}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
              {successMessage}
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thapar Email Address OR Roll No / Employee ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 102203456 or asharma_be22@thapar.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-thapar-800/20 focus:border-thapar-800 font-medium"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  You can log in using either your official Thapar email, student roll number, or faculty/staff ID.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-thapar-800/20 focus:border-thapar-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#8B1E2D' }}
                className="w-full py-2.5 px-4 rounded-xl bg-thapar-800 hover:bg-thapar-900 text-white font-bold text-sm shadow-md transition-all focus:outline-hidden focus:ring-2 focus:ring-thapar-800/50 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating TIET Account...' : 'Sign In to Resourcify'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* TAB 2: REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-thapar-800/20 focus:border-thapar-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {regRole === 'STUDENT'
                    ? 'Student Webmail (@thapar.edu)'
                    : regRole === 'FACULTY'
                    ? 'Official Faculty Email (@thapar.edu)'
                    : 'Administration Email (@thapar.edu)'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder={
                      regRole === 'STUDENT'
                        ? 'asharma_be22@thapar.edu'
                        : regRole === 'FACULTY'
                        ? 'rbawa@thapar.edu'
                        : 'estate.admin@thapar.edu'
                    }
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-thapar-800/20 focus:border-thapar-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-thapar-800/20 focus:border-thapar-800"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty Member / Professor</option>
                    <option value="ADMIN">Campus Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {regRole === 'STUDENT'
                      ? 'Student Roll Number *'
                      : regRole === 'FACULTY'
                      ? 'Faculty Employee ID *'
                      : 'Admin Staff ID *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      regRole === 'STUDENT'
                        ? 'e.g. 102203456'
                        : regRole === 'FACULTY'
                        ? 'e.g. TIET-FAC-1042'
                        : 'e.g. TIET-EST-001'
                    }
                    value={regRollNumber}
                    onChange={(e) => setRegRollNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-thapar-800/20 focus:border-thapar-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-thapar-800/20 focus:border-thapar-800"
                >
                  <option value="Computer Science & Engineering (CSED)">Computer Science & Engineering (CSED)</option>
                  <option value="Electronics & Communication (ECED)">Electronics & Communication (ECED)</option>
                  <option value="Electrical & Instrumentation (EIED)">Electrical & Instrumentation (EIED)</option>
                  <option value="Mechanical Engineering (MED)">Mechanical Engineering (MED)</option>
                  <option value="Biotechnology (BTD)">Biotechnology (BTD)</option>
                  <option value="Thapar School of Liberal Arts (TSLAS)">Thapar School of Liberal Arts (TSLAS)</option>
                  <option value="STEP Venture Lab / Incubator">STEP Venture Lab / Incubator</option>
                  <option value="Estate & Facilities Administration">Estate & Facilities Administration</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-thapar-800/20 focus:border-thapar-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-thapar-800/20 focus:border-thapar-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#8B1E2D' }}
                className="w-full py-2.5 px-4 rounded-xl bg-thapar-800 hover:bg-thapar-900 text-white font-bold text-sm shadow-md transition-all focus:outline-hidden focus:ring-2 focus:ring-thapar-800/50 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Registering with TIET...' : 'Complete TIET Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
