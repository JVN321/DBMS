'use client';

import { useEffect, useState } from 'react';
import { withAuth } from '@/lib/withAuth';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getLogs } from '@/lib/api';

function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetchLogs();
  }, [skip]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLogs({ skip, limit });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      setError(err.message || 'Error loading logs');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
        <p className="mt-1 text-sm text-muted">
          View user activities and system events (Total: {total} records)
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 p-4">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Logs Table */}
      {loading ? (
        <LoadingSpinner text="Loading activity logs..." />
      ) : logs.length === 0 ? (
        <div className="rounded-lg border border-card-border bg-card p-8 text-center">
          <p className="text-sm text-muted">No activity logs found</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-card-border">
            <table className="data-table">
              <thead className="bg-background/50">
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i}>
                    <td className="font-medium">{log.username}</td>
                    <td>
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-accent/20 text-accent">
                        {log.action}
                      </span>
                    </td>
                    <td className="text-xs">{log.details || '—'}</td>
                    <td className="text-xs text-muted">{formatTime(log.timestamp)}</td>
                    <td className="text-xs text-muted">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              Showing {skip + 1} to {Math.min(skip + limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSkip(Math.max(0, skip - limit))}
                disabled={skip === 0}
                className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
              >
                <ChevronUp size={16} className="inline mr-1" />
                Previous
              </button>
              <button
                onClick={() => setSkip(skip + limit)}
                disabled={skip + limit >= total}
                className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
              >
                Next
                <ChevronDown size={16} className="inline ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AdminLogsPage, { requireAdmin: true });
