'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { withAuth } from '@/lib/withAuth';
import { Users, FileText, BarChart3, Settings, ShieldAlert, UserCheck, UserX, Wallet } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { getSystemStats } from '@/lib/api';

function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getSystemStats();
      if (data && data.stats) {
        setStats(data.stats);
      } else {
        setError('Failed to load system statistics');
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          System overview and management tools
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <LoadingSpinner text="Loading statistics..." />
      ) : error ? (
        <div className="mb-8 rounded-lg border border-danger/30 bg-danger/5 p-4 interactive-card">
          <p className="text-sm text-danger">{error}</p>
        </div>
      ) : stats ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Users"
            value={stats.total_users}
            icon={<Users size={28} className="text-accent" />}
          />
          <StatCard
            label="Active Users"
            value={stats.active_users}
            icon={<UserCheck size={28} className="text-success" />}
          />
          <StatCard
            label="Banned Users"
            value={stats.banned_users}
            icon={<UserX size={28} className="text-danger" />}
          />
          <StatCard
            label="Total Wallets"
            value={stats.total_wallets}
            icon={<Wallet size={28} className="text-warning" />}
          />
        </div>
      ) : null}

      {/* Admin Sections */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Management</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* User Management */}
          <Link href="/admin/users">
            <div className="group rounded-xl border border-card-border bg-card p-6 transition-colors hover:border-accent/50 cursor-pointer interactive-card">
              <div className="rounded-lg bg-accent/10 p-3 w-fit mb-3">
                <Users size={24} className="text-accent" />
              </div>
              <h3 className="text-sm font-semibold group-hover:text-accent transition">
                Users
              </h3>
              <p className="text-xs text-muted mt-1">
                Manage user accounts, roles, and permissions
              </p>
            </div>
          </Link>

          {/* Activity Logs */}
          <Link href="/admin/logs">
            <div className="group rounded-xl border border-card-border bg-card p-6 transition-colors hover:border-accent/50 cursor-pointer interactive-card">
              <div className="rounded-lg bg-blue-500/10 p-3 w-fit mb-3">
                <FileText size={24} className="text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold group-hover:text-accent transition">
                Activity Logs
              </h3>
              <p className="text-xs text-muted mt-1">
                View user activities and system events
              </p>
            </div>
          </Link>

          {/* Suspicious Activity */}
          <Link href="/suspicious">
            <div className="group rounded-xl border border-card-border bg-card p-6 transition-colors hover:border-accent/50 cursor-pointer interactive-card">
              <div className="rounded-lg bg-red-500/10 p-3 w-fit mb-3">
                <ShieldAlert size={24} className="text-red-400" />
              </div>
              <h3 className="text-sm font-semibold group-hover:text-accent transition">
                Suspicious Activity
              </h3>
              <p className="text-xs text-muted mt-1">
                Analyze suspicious transaction patterns
              </p>
            </div>
          </Link>

          {/* Data Management */}
          <Link href="/admin/uploads">
            <div className="group rounded-xl border border-card-border bg-card p-6 transition-colors hover:border-accent/50 cursor-pointer interactive-card">
              <div className="rounded-lg bg-warning/10 p-3 w-fit mb-3">
                <BarChart3 size={24} className="text-warning" />
              </div>
              <h3 className="text-sm font-semibold group-hover:text-accent transition">
                Data Management
              </h3>
              <p className="text-xs text-muted mt-1">
                Manage user uploads and blockchain data
              </p>
            </div>
          </Link>

          {/* Settings */}
          <Link href="/admin/settings">
            <div className="group rounded-xl border border-card-border bg-card p-6 transition-colors hover:border-accent/50 cursor-pointer interactive-card">
              <div className="rounded-lg bg-success/10 p-3 w-fit mb-3">
                <Settings size={24} className="text-success" />
              </div>
              <h3 className="text-sm font-semibold group-hover:text-accent transition">
                Settings
              </h3>
              <p className="text-xs text-muted mt-1">
                Configure system settings and limits
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-card-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Tips</h2>
        <ul className="space-y-2 text-sm text-muted list-disc list-inside">
          <li>Monitor user activity in real-time through Activity Logs</li>
          <li>Manage user accounts and assign admin roles in Users section</li>
          <li>Configure system settings like upload limits in Settings</li>
          <li>Track all user data uploads in Data Management</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-5 interactive-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-background border border-card-border">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdminDashboardPage, { requireAdmin: true });
