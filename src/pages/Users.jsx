import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import UserProfileModal from '../components/UserProfileModal';
import AnimatedRow from '../components/AnimatedRow';
import { SkeletonTableRows } from '../components/Skeleton';
import { SearchIcon } from '../components/icons';
import { getUsers, suspendUser, activateUser, deleteUser } from '../api/admin';
import { extractArray, formatDate } from '../utils/format';

const ROLE_OPTIONS = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'FARMER', label: 'Farmer' },
  { value: 'EQUIPMENT_OWNER', label: 'Equipment Owner' },
  { value: 'BUYER', label: 'Buyer' },
  { value: 'ADMIN', label: 'Admin' },
];

const ROLE_BADGE_LABELS = {
  FARMER: 'Farmers',
  EQUIPMENT_OWNER: 'Owners',
  BUYER: 'Buyers',
  ADMIN: 'Admins',
  GENERAL: 'General',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [actioningId, setActioningId] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // { user, action: 'suspend' | 'delete' }

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getUsers();
      setUsers(extractArray(data));
    } catch {
      const msg = 'Could not load users. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const roleCounts = useMemo(() => {
    const counts = {};
    for (const u of users) {
      const role = u.role || 'GENERAL';
      counts[role] = (counts[role] || 0) + 1;
    }
    return counts;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesSearch =
        !query ||
        (u.fullName || u.name || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query);
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const handleToggleSuspend = async (user) => {
    const id = user.id;
    const action = user.suspended ? 'activate' : 'suspend';
    const name = user.fullName || user.email;
    setActioningId(id);
    try {
      if (action === 'suspend') {
        await suspendUser(id);
      } else {
        await activateUser(id);
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, suspended: !u.suspended } : u)));
      toast.success(action === 'suspend' ? `${name} was suspended.` : `${name} was activated.`);
    } catch {
      toast.error(`Could not ${action} this user. Please try again.`);
    } finally {
      setActioningId(null);
      setConfirmTarget(null);
    }
  };

  const handleDelete = async (user) => {
    const name = user.fullName || user.email;
    setActioningId(user.id);
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success(`${name} was deleted.`);
    } catch {
      toast.error('Could not delete this user. Please try again.');
    } finally {
      setActioningId(null);
      setConfirmTarget(null);
    }
  };

  const requestSuspendToggle = (user) => {
    if (user.suspended) {
      handleToggleSuspend(user);
      return;
    }
    setConfirmTarget({ user, action: 'suspend' });
  };

  const requestDelete = (user) => setConfirmTarget({ user, action: 'delete' });

  const confirmAction = () => {
    if (!confirmTarget) return;
    if (confirmTarget.action === 'suspend') handleToggleSuspend(confirmTarget.user);
    else handleDelete(confirmTarget.user);
  };

  return (
    <Layout title="Users">
      <div className="mb-5 flex flex-wrap gap-2">
        {Object.entries(ROLE_BADGE_LABELS).map(([role, label]) => (
          <span
            key={role}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600"
          >
            {label}
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-primary">{roleCounts[role] || 0}</span>
          </span>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-56"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Region</th>
                <th className="px-5 py-3 font-semibold">Phone</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Joined Date</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonTableRows columns={8} />
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, i) => (
                  <AnimatedRow key={u.id} index={i} className="transition-colors duration-150 hover:bg-gray-50/80">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{u.fullName || u.name || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{u.region || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{u.phoneNumber || u.phone || '—'}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={u.suspended ? 'SUSPENDED' : 'ACTIVE'} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setProfileUser(u)}
                          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200"
                        >
                          View
                        </button>
                        <button
                          onClick={() => requestSuspendToggle(u)}
                          disabled={actioningId === u.id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            u.suspended
                              ? 'bg-primary/10 text-primary hover:bg-primary/20'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          {actioningId === u.id ? '…' : u.suspended ? 'Activate' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => requestDelete(u)}
                          disabled={actioningId === u.id}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </AnimatedRow>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserProfileModal user={profileUser} onClose={() => setProfileUser(null)} />

      <ConfirmDialog
        open={!!confirmTarget}
        title={
          confirmTarget?.action === 'delete'
            ? `Delete ${confirmTarget.user.fullName || confirmTarget.user.email}?`
            : `Suspend ${confirmTarget?.user?.fullName || confirmTarget?.user?.email}?`
        }
        message={
          confirmTarget?.action === 'delete'
            ? 'This permanently removes the user account. This cannot be undone.'
            : 'The user will lose access to their account until reactivated.'
        }
        confirmLabel={confirmTarget?.action === 'delete' ? 'Delete User' : 'Suspend User'}
        danger
        loading={actioningId === confirmTarget?.user?.id}
        onConfirm={confirmAction}
        onCancel={() => setConfirmTarget(null)}
      />
    </Layout>
  );
}
