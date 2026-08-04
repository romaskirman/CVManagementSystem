import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi, UserRole } from '../../shared/api/admin.api';
import { DataTable } from '../../shared/components/tables/DataTable';
import { UsersFiltersBar } from '../../features/admin/components/UsersFiltersBar';
import { AdminUserListItem } from '../../features/admin/types';
import * as React from 'react';

type CreateUserFormState = {
  email: string;
  password: string;
  roleCode: UserRole;
};

function getErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message;
  }

  return 'Something went wrong';
}

export function UsersPage() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<{
    q: string;
    status: 'ACTIVE' | 'BLOCKED' | 'ALL';
  }>({
    q: '',
    status: 'ALL'
  });

  const [form, setForm] = useState<CreateUserFormState>({
    email: '',
    password: '',
    roleCode: 'CANDIDATE'
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () =>
      adminApi.listUsers({
        q: filters.q || undefined,
        status: filters.status,
        page: 1,
        pageSize: 50
      })
  });

  const createUserMutation = useMutation({
    mutationFn: () => adminApi.createUser(form),
    onSuccess: async () => {
      setForm({
        email: '',
        password: '',
        roleCode: 'CANDIDATE'
      });
      setFormError(null);
      setFormSuccess('User has been created successfully.');

      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      setFormSuccess(null);
      setFormError(getErrorMessage(error));
    }
  });

  const rows: AdminUserListItem[] = useMemo(() => data?.items ?? [], [data]);

  const handleCreateUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    createUserMutation.mutate();
  };

  return (
    <section className="page-section">
      <div className="page-header">
        <h1>Users</h1>
        <p>Administrators can manage blocking, roles, account access, and create users.</p>
      </div>

      <section className="card-block form-section create-user-title-dark">
        <h2>Create user</h2>
        <form className="create-user-form" onSubmit={handleCreateUserSubmit}>
          <div className="create-user-form__grid">
            <label className="create-user-form__field">
              <span className="create-user-form__label">Email</span>
              <div className="create-user-form__input-shell">
                <input
                  className="create-user-form__input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  autoComplete="off"
                  required
                />
              </div>
            </label>

            <label className="create-user-form__field">
              <span className="create-user-form__label">Password</span>
              <div className="create-user-form__input-shell">
                <input
                  className="create-user-form__input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </label>

            <label className="create-user-form__field">
              <span className="create-user-form__label">Role</span>
              <div className="create-user-form__select-shell">
                <select
                  className="create-user-form__select"
                  value={form.roleCode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      roleCode: e.target.value as UserRole
                    }))
                  }
                >
                  <option value="CANDIDATE">Candidate</option>
                  <option value="RECRUITER">Recruiter</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                <span className="create-user-form__select-icon">▾</span>
              </div>
            </label>
          </div>

          <div className="inline-actions create-user-form__actions">
            <button
              type="submit"
              className="btn-primary create-user-form__submit"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? 'Creating...' : 'Create user'}
            </button>
          </div>

          {formError ? <div className="error-text create-user-form__feedback">{formError}</div> : null}
          {formSuccess ? (
            <div className="success-text create-user-form__feedback">{formSuccess}</div>
          ) : null}
        </form>
      </section>

      <UsersFiltersBar
        initialQuery={filters.q}
        initialStatus={filters.status}
        onApply={(next) => setFilters(next)}
      />

      {isLoading ? (
        <div>Loading users...</div>
      ) : (
        <DataTable
          rows={rows}
          emptyText="No users found"
          columns={[
            {
              key: 'email',
              title: 'Email',
              render: (row) => row.email
            },
            {
              key: 'displayName',
              title: 'Display name',
              render: (row) => row.displayName ?? '—'
            },
            {
              key: 'roles',
              title: 'Roles',
              render: (row) => row.roles.join(', ')
            },
            {
              key: 'status',
              title: 'Status',
              render: (row) => (row.isBlocked ? 'Blocked' : 'Active')
            },
            {
              key: 'createdAt',
              title: 'Created',
              render: (row) => new Date(row.createdAt).toLocaleString()
            },
            {
              key: 'open',
              title: 'Open',
              render: (row) => <Link to={`/admin/users/${row.id}`}>Details</Link>
            }
          ]}
        />
      )}
    </section>
  );
}
