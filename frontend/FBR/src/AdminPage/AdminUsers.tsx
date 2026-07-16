import { useEffect, useState } from 'react';
import api from '../api/axios';
import AdminSidebar from './AdminSidebar';

type RecentLogin = {
  loggedInAt: string;
  ipAddress: string;
  userAgent: string;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  authorizedAccess: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  loginCount: number;
  recentLogins: RecentLogin[];
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    api.get('/admin/users')
      .then((res) => {
        if (!mounted) return;
        setUsers(res.data.users || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Unable to load users.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminSidebar>
      <div className="space-y-6">
        <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-300">Admin Control</p>
              <h2 className="text-2xl font-semibold">Registered User Directory</h2>
              <p className="mt-2 text-sm text-slate-300">View real names, access status, and recent login history for every registered user.</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
              <div className="text-slate-300">Total users</div>
              <div className="text-2xl font-semibold">{users.length}</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">Loading users...</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Access</th>
                    <th className="px-4 py-3 font-semibold">Last login</th>
                    <th className="px-4 py-3 font-semibold">Login count</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                        <div className="mt-2 text-xs text-slate-400">Registered {new Date(user.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{user.role}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${user.authorizedAccess ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {user.authorizedAccess ? 'Authorized' : 'Restricted'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'No login yet'}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{user.loginCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-700">Recent login activity</h3>
                <div className="mt-3 space-y-3">
                  {users.slice(0, 3).map((user) => (
                    <div key={`${user.id}-activity`} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.loginCount} logins</div>
                      </div>
                      {user.recentLogins.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs text-slate-600">
                          {user.recentLogins.map((entry, index) => (
                            <li key={`${user.id}-${index}`}>
                              {new Date(entry.loggedInAt).toLocaleString()} • {entry.ipAddress || 'Unknown IP'}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-2 text-xs text-slate-500">No login history recorded yet.</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminSidebar>
  );
}
