'use client';

import { useEffect, useState } from 'react';
import { withAuth } from '@/lib/withAuth';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ConfirmDialog from '@/app/components/ConfirmDialog';

function AdminUploadsPage() {
  const token = localStorage.getItem('auth_token');
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // In a real app, you'd fetch upload history from the backend
    // For now, we'll show a message
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      // Placeholder: In production, create a backend endpoint like GET /uploads
      setUploads([]);
    } catch (err) {
      setError('Error loading uploads');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteDialog({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    // Implementation for deleting uploads
    setActionLoading(true);
    try {
      // Make API call to delete upload
      setDeleteDialog({ isOpen: false, id: null });
      fetchUploads();
    } catch (err) {
      setError('Failed to delete upload');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Data Management</h1>
        <p className="mt-1 text-sm text-muted">
          Manage user data uploads and blockchain transaction data
        </p>
      </div>

      {/* Info Message */}
      <div className="rounded-lg border border-card-border bg-card p-6 text-center">
        <p className="text-sm text-muted">
          Upload tracking is available when users upload data through the upload page. This section allows you to:
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted text-left max-w-md mx-auto">
          <li>✓ View all user-uploaded files</li>
          <li>✓ Check upload statistics and file details</li>
          <li>✓ Delete user uploads if needed</li>
          <li>✓ Monitor data processing status</li>
        </ul>
        <p className="mt-6 text-xs text-muted">
          To enable full tracking, create a backend endpoint: <code className="bg-background px-2 py-1 rounded">GET /uploads</code>
        </p>
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Upload?"
        message="Are you sure you want to permanently delete this upload? This cannot be undone."
        confirmText="Delete"
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
        onConfirm={handleConfirmDelete}
        isLoading={actionLoading}
        isDangerous
      />
    </div>
  );
}

export default withAuth(AdminUploadsPage, { requireAdmin: true });
