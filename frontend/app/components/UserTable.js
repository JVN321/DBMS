'use client';

import { Trash2, Edit, Lock, Unlock } from 'lucide-react';

export default function UserTable({ users, onEdit, onBan, onDelete, loading }) {
  if (!users || users.length === 0) {
    return (
      <div className="rounded-lg border border-card-border bg-card p-8 text-center">
        <p className="text-sm text-muted">No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-card-border">
      <table className="data-table">
        <thead className="bg-background/50">
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.username}>
              <td className="font-medium">{user.username}</td>
              <td>{user.email}</td>
              <td>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  user.role === 'admin'
                    ? 'bg-accent/20 text-accent'
                    : 'bg-muted/20 text-muted'
                }`}>
                  {user.role}
                </span>
              </td>
              <td>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  user.is_banned
                    ? 'bg-danger/20 text-danger'
                    : 'bg-success/20 text-success'
                }`}>
                  {user.is_banned ? 'Banned' : 'Active'}
                </span>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-1 text-muted hover:text-accent transition"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onBan(user)}
                    className={`p-1 transition ${
                      user.is_banned
                        ? 'text-success hover:text-success/80'
                        : 'text-warning hover:text-warning/80'
                    }`}
                    title={user.is_banned ? 'Unban' : 'Ban'}
                    disabled={loading}
                  >
                    {user.is_banned ? <Unlock size={16} /> : <Lock size={16} />}
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    className="p-1 text-muted hover:text-danger transition"
                    title="Delete"
                    disabled={loading}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
