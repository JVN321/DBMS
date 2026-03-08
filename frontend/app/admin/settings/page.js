'use client';

import { useEffect, useState } from 'react';
import { withAuth } from '@/lib/withAuth';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { CheckCircle, AlertCircle } from 'lucide-react';

function AdminSettingsPage() {
  const token = localStorage.getItem('auth_token');
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/settings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setFormData(data.settings);
      } else {
        setError('Failed to load settings');
      }
    } catch (err) {
      setError('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        setSuccess('Settings updated successfully!');
        fetchSettings();
      } else {
        setError('Failed to save settings');
      }
    } catch (err) {
      setError('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Configure system limits and settings
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-success/30 bg-success/5 p-4">
          <CheckCircle size={18} className="mt-0.5 shrink-0 text-success" />
          <p className="text-sm text-success">{success}</p>
        </div>
      )}

      {/* Settings Form */}
      {loading ? (
        <LoadingSpinner text="Loading settings..." />
      ) : formData && Object.keys(formData).length > 0 ? (
        <div className="max-w-2xl">
          <div className="rounded-xl border border-card-border bg-card p-6 space-y-6">
            {/* Max Upload Size */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max Upload Size (MB)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.max_upload_size_mb || 50}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_upload_size_mb: parseInt(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted">
                Maximum file size for data uploads
              </p>
            </div>

            {/* Max Users */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max Users
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_users || 100}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_users: parseInt(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted">
                Maximum allowed user accounts
              </p>
            </div>

            {/* Maintenance Mode */}
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.maintenance_mode || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maintenance_mode: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-foreground">
                  Maintenance Mode
                </span>
              </label>
              <p className="mt-1 text-xs text-muted ml-7">
                When enabled, only admins can access the system
              </p>
            </div>

            {/* API Rate Limit */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                API Rate Limit (requests per window)
              </label>
              <input
                type="number"
                min="100"
                value={formData.api_rate_limit || 1000}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    api_rate_limit: parseInt(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted">
                Maximum API requests per window period
              </p>
            </div>

            {/* Rate Limit Window */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rate Limit Window (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={formData.api_rate_window_minutes || 60}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    api_rate_window_minutes: parseInt(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted">
                Time window for rate limit calculations
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleReset}
                disabled={saving}
                className="flex-1 rounded-lg border border-card-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default withAuth(AdminSettingsPage, { requireAdmin: true });
