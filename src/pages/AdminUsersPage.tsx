import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, Trash2 } from 'lucide-react';

import type { User, UserRole } from '../api/contract';
import { useAdminUsers, useDeleteUser, useSetUserActive } from '../api/hooks';
import { useAuth } from '../context/auth';
import { AvatarImg, ConfirmModal, EmptyState, ErrorState, FeedbackBanner, LoadingState, Pager } from '../components/portal/PortalUI';
import { useDebouncedValue, useFeedback } from '../components/portal/hooks';
import { formatIso } from '../components/portal/format';

type RoleTab = 'all' | UserRole;
type Pending = { user: User; action: 'toggle' | 'delete' };
const PAGE_SIZE = 25;

export const AdminUsersPage: React.FC = () => {
  const { user: me } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleTab>('all');
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchTerm.trim()) || undefined;

  const list = useAdminUsers({ search, role: roleFilter === 'all' ? undefined : roleFilter, page, pageSize: PAGE_SIZE });
  const counts: Record<RoleTab, number | undefined> = {
    all: useAdminUsers({ search, pageSize: 1 }).data?.total,
    patient: useAdminUsers({ search, role: 'patient', pageSize: 1 }).data?.total,
    doctor: useAdminUsers({ search, role: 'doctor', pageSize: 1 }).data?.total,
    admin: useAdminUsers({ search, role: 'admin', pageSize: 1 }).data?.total,
  };

  const setActive = useSetUserActive();
  const deleteUser = useDeleteUser();
  const feedback = useFeedback();
  const [pending, setPending] = useState<Pending | null>(null);

  const open = (user: User, action: Pending['action']) => {
    setActive.reset();
    deleteUser.reset();
    setPending({ user, action });
  };

  const confirm = () => {
    if (!pending) return;
    const { user, action } = pending;
    if (action === 'delete') {
      deleteUser.mutate(user.id, {
        onSuccess: () => {
          setPending(null);
          feedback.success(`${user.name}'s account was deleted.`);
        },
      });
    } else {
      setActive.mutate(
        { id: user.id, isActive: !user.isActive },
        {
          onSuccess: (u) => {
            setPending(null);
            feedback.success(`${u.name} has been ${u.isActive ? 'reactivated' : 'deactivated and signed out'}.`);
          },
        },
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Dashboard</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">User Accounts & Permissions</h1>
          <p className="text-xs text-slate-500 mt-1">Registered patient, doctor and administrator accounts.</p>
        </div>
        {counts.all !== undefined && (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">{counts.all} Registered Accounts</span>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            aria-label="Search users"
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
          {(['all', 'patient', 'doctor', 'admin'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRoleFilter(r);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all shrink-0 ${
                roleFilter === r ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r}
              {counts[r] !== undefined ? ` (${counts[r]})` : ''}
            </button>
          ))}
        </div>
      </div>

      <FeedbackBanner feedback={feedback.feedback} onClose={feedback.clear} />

      {list.isPending ? (
        <LoadingState label="Loading accounts…" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} title="Couldn’t load accounts" />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No accounts found" message="Try a different role filter or search." />
      ) : (
        <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card ${list.isPlaceholderData ? 'opacity-60' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">User Profile</th>
                  <th className="px-5 py-3.5">System Role</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Registration Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {list.data.items.map((u) => {
                  const isMe = u.id === me?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <AvatarImg src={u.avatarUrl} name={u.name} className="w-9 h-9 rounded-xl border border-slate-200" />
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {u.name}
                              {isMe && <span className="ml-1.5 text-[10px] font-semibold text-purple-600">(you)</span>}
                            </span>
                            {u.role === 'doctor' && !u.doctorId && <span className="text-[10px] text-amber-600">No doctor profile linked</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : u.role === 'doctor'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-slate-800 block">{u.email}</span>
                        <span className="text-[11px] text-slate-500">{u.phone || 'No phone provided'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{formatIso(u.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={isMe}
                            title={isMe ? 'You can’t deactivate your own account' : undefined}
                            onClick={() => open(u, 'toggle')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.isActive
                                ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                                : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            disabled={isMe}
                            onClick={() => open(u, 'delete')}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isMe ? 'You can’t delete your own account' : 'Delete user'}
                            aria-label={`Delete ${u.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 pb-4">
            <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />
          </div>
        </div>
      )}

      <ConfirmModal
        open={pending !== null}
        title={
          pending
            ? pending.action === 'delete'
              ? `Delete ${pending.user.name}'s account?`
              : `${pending.user.isActive ? 'Deactivate' : 'Reactivate'} ${pending.user.name}?`
            : ''
        }
        message={
          pending?.action === 'delete'
            ? `This permanently removes the account, its appointments and reviews. ${
                pending.user.role === 'doctor' ? 'Their doctor profile stays in the directory without a login. ' : ''
              }This can’t be undone.`
            : pending?.user.isActive
              ? 'They will be signed out everywhere and unable to sign in until reactivated.'
              : 'They will be able to sign in again.'
        }
        tone={pending && (pending.action === 'delete' || pending.user.isActive) ? 'danger' : 'default'}
        confirmLabel={pending?.action === 'delete' ? 'Delete account' : pending?.user.isActive ? 'Deactivate' : 'Reactivate'}
        pending={setActive.isPending || deleteUser.isPending}
        error={setActive.error ?? deleteUser.error}
        onClose={() => setPending(null)}
        onConfirm={confirm}
      />
    </div>
  );
};
