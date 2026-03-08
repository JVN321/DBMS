'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { withAuth } from '@/lib/withAuth';
import { UserPlus } from 'lucide-react';
import UserTable from '@/app/components/UserTable';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import LoadingSpinner from '@/app/components/LoadingSpinner';

function AdminUsersPage() {
  const token = localStorage.getItem('auth_token');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [editDialog, setEditDialog] = useState({ isOpen: false, user: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, user: null });
  const [banDialog, setBanDialog] = useState({ isOpen: false, user: null });

  // Edit form state
  const [editForm, setEditForm] = useState({ role: 'user' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditForm({ role: user.role });
    setEditDialog({ isOpen: true, user });
  };

  const handleSaveEdit = async () => {
    if (!editDialog.user) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/users/${editDialog.user.username}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: editForm.role }),
        }
      );

      if (response.ok) {
        setEditDialog({ isOpen: false, user: null });
        fetchUsers();
      } else {
        setError('Failed to update user');
      }
    } catch (err) {
      setError('Error updating user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async (user) => {
    setBanDialog({ isOpen: true, user });
  };

  const handleConfirmBan = async () => {
    if (!banDialog.user) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/users/${banDialog.user.username}/ban`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_banned: !banDialog.user.is_banned }),
        }
      );

      if (response.ok) {
        setBanDialog({ isOpen: false, user: null });
        fetchUsers();
      } else {
        setError('Failed to update user ban status');
      }
    } catch (err) {
      setError('Error updating user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (user) => {
    setDeleteDialog({ isOpen: true, user });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.user) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/users/${deleteDialog.user.username}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setDeleteDialog({ isOpen: false, user: null });
        fetchUsers();
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      setError('Error deleting user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
        <p className="mt-1 text-sm text-muted">
          View and manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 p-4">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner text="Loading users..." />
      ) : (
        <UserTable
          users={users}
          onEdit={handleEdit}
          onBan={handleBan}
          onDelete={handleDelete}
          loading={actionLoading}
        />
      )}

      {/* Edit Dialog */}
      <ConfirmDialog
        isOpen={editDialog.isOpen}
        title={`Edit User: ${editDialog.user?.username}`}
        message="Change the user's role"
        onCancel={() => setEditDialog({ isOpen: false, user: null })}
        onConfirm={handleSaveEdit}
        isLoading={actionLoading}
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">Role</label>
          <select
            value={editForm.role}
            onChange={(e) => setEditForm({ role: e.target.value })}
            className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </ConfirmDialog>

      {/* Ban Dialog */}
      <ConfirmDialog
        isOpen={banDialog.isOpen}
        title={banDialog.user?.is_banned ? 'Unban User?' : 'Ban User?'}
        message={
          banDialog.user?.is_banned
            ? `Are you sure you want to unban ${banDialog.user?.username}?`
            : `Are you sure you want to ban ${banDialog.user?.username}? They won't be able to access the system.`
        }
        confirmText={banDialog.user?.is_banned ? 'Unban' : 'Ban'}
        onCancel={() => setBanDialog({ isOpen: false, user: null })}
        onConfirm={handleConfirmBan}
        isLoading={actionLoading}
        isDangerous={!banDialog.user?.is_banned}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete User?"
        message={`Are you sure you want to permanently delete ${deleteDialog.user?.username}? This cannot be undone.`}
        confirmText="Delete"
        onCancel={() => setDeleteDialog({ isOpen: false, user: null })}
        onConfirm={handleConfirmDelete}
        isLoading={actionLoading}
        isDangerous
      />
    </div>
  );
}

export default withAuth(AdminUsersPage, { requireAdmin: true });
