import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import StatCard from '../components/StatCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatCategory, formatDate } from '../utils/formatters.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Calendar,
  Building2,
  TrendingUp,
  AlertOctagon,
  XCircle,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggeringJob, setTriggeringJob] = useState(false);
  const [jobResult, setJobResult] = useState(null);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      if (res.data?.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleTriggerAutoRelease = async () => {
    setTriggeringJob(true);
    setJobResult(null);
    try {
      const res = await api.post('/jobs/auto-release');
      if (res.data?.success) {
        setJobResult(res.data.data);
        fetchAnalytics();
      }
    } catch (err) {
      alert(`Auto-release trigger failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setTriggeringJob(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Calculating real-time campus analytics & DynamoDB slot stats..." />;
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">
        Analytics data currently unavailable.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Scheduled Auto-Release Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-purple-50 text-purple-800 border border-purple-200">
              EXECUTIVE MONITORING
            </span>
            <span className="text-xs text-slate-400">• CloudWatch & DynamoDB Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tracking-tight">
            Campus Resource Analytics & Utilization
          </h1>
          <p className="text-sm text-slate-500">
            Real-time KPIs, peak booking hours, capacity utilization, and automated slot lock recycling.
          </p>
        </div>

        {/* Scheduled Job Trigger Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleTriggerAutoRelease}
            disabled={triggeringJob}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${triggeringJob ? 'animate-spin' : ''}`} />
            <span>{triggeringJob ? 'Processing...' : 'Run Auto-Release Job'}</span>
          </button>
        </div>
      </div>

      {/* Auto-Release Job Execution Notification */}
      {jobResult && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>
            Auto-Release Job executed successfully! Processed {jobResult.processedCount} expired bookings.
          </span>
          <button onClick={() => setJobResult(null)} className="font-bold text-emerald-600">
            Dismiss
          </button>
        </div>
      )}

      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Campus Bookings"
          value={analytics.totalBookings}
          subtitle={`${analytics.activeBookings} currently active`}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Active Slot Locks"
          value={analytics.currentlyLockedSlots}
          subtitle="Atomic DynamoDB locks held"
          icon={Building2}
          color="emerald"
        />
        <StatCard
          title="Cancellation Rate"
          value={`${analytics.cancellationRate}%`}
          subtitle={`${analytics.cancelledBookings} cancelled bookings`}
          icon={XCircle}
          color="rose"
        />
        <StatCard
          title="No-Show Rate"
          value={`${analytics.noShowRate}%`}
          subtitle={`${analytics.noShowBookings} expired check-ins`}
          icon={AlertOctagon}
          color="amber"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Booking Hours */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Peak Booking Hours</h2>
              <p className="text-xs text-slate-500">Distribution of campus reservations across operating hours</p>
            </div>
            <Clock className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#93c5fd' }}
                />
                <Bar dataKey="bookingsCount" name="Bookings" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Utilization */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Category Utilization</h2>
              <p className="text-xs text-slate-500">Relative booking demand across facility types</p>
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.categoryUtilization.map((c) => ({
                  name: formatCategory(c.category),
                  bookings: c.bookingsCount,
                  resources: c.resourceCount,
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="bookings" name="Bookings Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top vs Underutilized Facilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Utilized */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Most Utilized Facilities</h2>
          <div className="space-y-3">
            {analytics.topUtilizedResources.map((res) => (
              <div key={res.resourceId} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">{res.name}</span>
                  <span className="text-slate-500 font-mono">{res.bookingsCount} bookings ({res.utilizationPercent}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-campus-800 h-2 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(10, res.utilizationPercent))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Underutilized */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Underutilized Facilities</h2>
          <div className="space-y-3">
            {analytics.underutilizedResources.map((res) => (
              <div key={res.resourceId} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">{res.name}</span>
                  <span className="text-slate-500 font-mono">{res.bookingsCount} bookings ({res.utilizationPercent}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(5, res.utilizationPercent))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Campus Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-6">
        <h2 className="text-base font-bold text-slate-900">Recent Campus Reservation Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Venue</th>
                <th className="pb-3">Reserved By</th>
                <th className="pb-3">Date & Time</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.recentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="py-3 font-semibold text-slate-900">{b.resourceName}</td>
                  <td className="py-3 text-slate-600">
                    {b.userName} <span className="text-slate-400">({b.userRole})</span>
                  </td>
                  <td className="py-3 text-slate-600">
                    {formatDate(b.date)} • {b.startTime}-{b.endTime}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
