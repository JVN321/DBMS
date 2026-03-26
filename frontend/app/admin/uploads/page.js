'use client';

import { useEffect, useState } from 'react';
import { withAuth } from '@/lib/withAuth';
import { getAdminDatasets, deleteAdminDataset } from '@/lib/api';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ConfirmDialog from '@/app/components/ConfirmDialog';

function AdminUploadsPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminDatasets();
      setDatasets(data.datasets || []);
    } catch (err) {
      setError('Error loading datasets: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteDialog({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    setActionLoading(true);
    try {
      await deleteAdminDataset(deleteDialog.id);
      setDeleteDialog({ isOpen: false, id: null });
      fetchDatasets();
    } catch (err) {
      setError('Failed to delete dataset: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Data Management</h1>
        <p className="mt-1 text-sm text-muted">
          Manage user data uploads and system datasets.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-md bg-red-500/10 p-4 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Dataset Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : datasets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted">No datasets uploaded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background/50 text-muted">
                <tr>
                  <th className="px-6 py-4 font-medium">Dataset / ID</th>
                  <th className="px-6 py-4 font-medium">Owner</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Transactions</th>
                  <th className="px-6 py-4 font-medium">Uploaded At</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {datasets.map((d) => (
                  <tr key={d.id} className="hover:bg-background/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{d.name}</span>
                        <span className="text-xs text-muted font-mono mt-1">{d.id}</span>
                        {d.filename && (
                          <span className="text-xs text-muted truncate max-w-[200px]" title={d.filename}>
                            File: {d.filename}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded tracking-wide font-mono text-xs font-medium bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                        {d.owner}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={"inline-flex items-center rounded-full px-2 py-1 text-xs font-medium " + ((d.userStatus || 'active') === 'active' ? 'bg-green-500/10 text-green-400' : (d.userStatus || 'active') === 'banned' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400')}>
                        {(d.userStatus || 'active').charAt(0).toUpperCase() + (d.userStatus || 'active').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground font-medium">
                      {(d.rowCount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-muted whitespace-nowrap">
                      {formatDate(d.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Dataset"
        message="Are you sure you want to permanently delete this dataset and all associated wallets, transactions, and analysis data? This action cannot be undone."
        confirmText="Delete Dataset"
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
        onConfirm={handleConfirmDelete}
        isLoading={actionLoading}
        isDangerous={true}
      />
    </div>
  );
}

export default withAuth(AdminUploadsPage, { requireAdmin: true });
