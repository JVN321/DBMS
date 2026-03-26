'use client';

import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { withAuth } from '@/lib/withAuth';
import UserTable from '@/app/components/UserTable';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { getUsers, updateUser, banUser, deleteUser, createUser } from '@/lib/api';

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ isOpen: false, user: null });  
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, user: null });
  const [banDialog, setBanDialog] = useState({ isOpen: false, user: null });    

  // Forms state
  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [editForm, setEditForm] = useState({ role: 'user' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCreate = async () => {
    if (!createForm.username || !createForm.email || !createForm.password) {
      setError('Please fill in all fields');
      return;
    }

    setActionLoading(true);
    try {
      setError(null);
      await createUser(createForm);
      setCreateDialog(false);
      setCreateForm({ username: '', email: '', password: '', role: 'user' });
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Error creating user');
    } finally {
      setActionLoading(false);
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
      setError(null);
      await updateUser(editDialog.user.username, { role: editForm.role });
      setEditDialog({ isOpen: false, user: null });
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Error updating user');
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
      setError(null);
      await banUser(banDialog.user.username, !banDialog.user.is_banned);
      setBanDialog({ isOpen: false, user: null });
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Error updating user');
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
      setError(null);
      await deleteUser(deleteDialog.user.username);
      setDeleteDialog({ isOpen: false, user: null });
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Error deleting user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>     
          <p className="mt-1 text-sm text-muted">
            View and manage user accounts, roles, and permissions
          </p>
        </div>
        <button
          onClick={() => setCreateDialog(true)}
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <UserPlus className="h-4 w-4" />
          Create User
        </button>
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

      {/* Create Dialog */}
      <ConfirmDialog
        isOpen={createDialog}
        title="Create New User"
        message="Add a new user to the system."
        confirmText="Create User"
        onCancel={() => {
          setCreateDialog(false);
          setCreateForm({ username: '', email: '', password: '', role: 'user' });
        }}
        onConfirm={handleSaveCreate}
        isLoading={actionLoading}
      >
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Username</label>
            <input
              type="text"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
              placeholder="Username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
              placeholder="Email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Password</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
              placeholder="Minimum 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Role</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </ConfirmDialog>

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
