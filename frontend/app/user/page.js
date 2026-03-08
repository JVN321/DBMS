'use client';

import { useAuth } from '@/lib/authContext';
import { withAuth } from '@/lib/withAuth';
import { Upload, BarChart3, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

function UserDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.username}!</h1>
        <p className="mt-1 text-sm text-muted">
          Manage your blockchain transaction data and analysis
        </p>
      </div>

      {/* User Info Card */}
      <div className="mb-8 rounded-xl border border-card-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Your Profile</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">Username:</span>
            <span className="text-sm font-medium text-foreground">{user?.username}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">Email:</span>
            <span className="text-sm font-medium text-foreground">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">Role:</span>
            <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Upload Data */}
          <Link href="/upload">
            <div className="group rounded-xl border border-card-border bg-card p-6 transition-colors hover:border-accent/50 cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-accent/10 p-3">
                  <Upload size={24} className="text-accent" />
                </div>
                <h3 className="text-sm font-semibold group-hover:text-accent transition">
                  Upload Data
                </h3>
              </div>
              <p className="text-xs text-muted">
                Import transaction datasets in CSV or JSON format
              </p>
            </div>
          </Link>

          {/* Explore Graph */}
          <Link href="/graph">
            <div className="group rounded-xl border border-card-border bg-card p-6 transition-colors hover:border-accent/50 cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <BarChart3 size={24} className="text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold group-hover:text-accent transition">
                  Explore Graph
                </h3>
              </div>
              <p className="text-xs text-muted">
                Visualize wallet transaction networks
              </p>
            </div>
          </Link>

          {/* Fraud Detection */}
          <Link href="/suspicious">
            <div className="group rounded-xl border border-card-border bg-card p-6 transition-colors hover:border-accent/50 cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-warning/10 p-3">
                  <AlertTriangle size={24} className="text-warning" />
                </div>
                <h3 className="text-sm font-semibold group-hover:text-accent transition">
                  Fraud Detection
                </h3>
              </div>
              <p className="text-xs text-muted">
                Analyze suspicious transaction patterns
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-xl border border-card-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
        <div className="space-y-4 text-sm text-muted">
          <p>
            As a regular user, you can upload and analyze blockchain transaction data. Here's how to get started:
          </p>
          <ol className="space-y-2 list-decimal list-inside">
            <li>Click <span className="text-accent font-medium">"Upload Data"</span> above to import your transaction file</li>
            <li>Use <span className="text-accent font-medium">"Explore Graph"</span> to visualize wallet connections</li>
            <li>Check <span className="text-accent font-medium">"Fraud Detection"</span> to identify suspicious patterns</li>
          </ol>
          <p className="text-xs mt-4">
            Supported formats: CSV and JSON (max 50MB). Columns should include: transaction_id, wallet_from, wallet_to, amount, coin_type, timestamp
          </p>
        </div>
      </div>
    </div>
  );
}

export default withAuth(UserDashboardPage, { requireAdmin: false });
