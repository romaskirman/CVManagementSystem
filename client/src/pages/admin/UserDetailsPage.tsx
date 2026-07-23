import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi, UserRole } from '../../shared/api/admin.api';
import { useAuth } from '../../app/providers/AuthProvider';
import { UserRolesPanel } from '../../features/admin/components/UserRolesPanel';
import { AdminUserDetails } from '../../features/admin/types';
import * as React from 'react';

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

export function UserDetailsPage() {
  const { userId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user: currentUser, refetchMe } = useAuth();
  const [actionError, setActionError] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user-details', userId],
    queryFn: () => adminApi.getUserById(userId!),
    enabled: Boolean(userId)
  });

  const blockMutation = useMutation({
    mutationFn: () => adminApi.blockUser(userId!),
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-user-details', userId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    }
  });

  const unblockMutation = useMutation({
    mutationFn: () => adminApi.unblockUser(userId!),
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-user-details', userId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteUser(userId!),
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      navigate('/admin/users');
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    }
  });

  const assignRoleMutation = useMutation({
    mutationFn: async (role: UserRole) => {
      const result = await adminApi.assignRole(userId!, role);
      if (currentUser?.id === userId) {
        await refetchMe();
      }
      return result;
    },
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-user-details', userId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    }
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (role: UserRole) => {
      const result = await adminApi.removeRole(userId!, role);
      if (currentUser?.id === userId) {
        await refetchMe();
      }
      return result;
    },
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-user-details', userId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    }
  });

  if (isLoading || !data) {
    return <div className="page-section">Loading user...</div>;
  }

  const user = data as AdminUserDetails;
  const isSelf = currentUser?.id === user.id;

  return (
    <section className="page-section">
      <div className="page-header page-header--row">
        <div>
          <h1>User details</h1>
          <p>{user.email}</p>
        </div>

        <div className="inline-actions">
          <Link className="btn-secondary" to="/admin/users">
            Back to users
          </Link>

          {user.isBlocked ? (
            <button
              className="btn-secondary"
              onClick={() => unblockMutation.mutate()}
              disabled={unblockMutation.isPending}
            >
              Unblock
            </button>
          ) : (
            <button
              className="btn-secondary"
              onClick={() => blockMutation.mutate()}
              disabled={blockMutation.isPending}
            >
              Block
            </button>
          )}

          <button
            className="btn-danger"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            Delete user
          </button>
        </div>
      </div>

      {actionError ? <div className="error-text">{actionError}</div> : null}

      <section className="card-block form-section">
        <h2>Account</h2>
        <div className="details-grid">
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Display name:</strong> {user.displayName ?? '—'}</div>
          <div><strong>Status:</strong> {user.isBlocked ? 'Blocked' : 'Active'}</div>
          <div><strong>Created:</strong> {new Date(user.createdAt).toLocaleString()}</div>
          <div><strong>Updated:</strong> {new Date(user.updatedAt).toLocaleString()}</div>
        </div>
      </section>

      <section className="card-block form-section">
        <h2>Profile summary</h2>
        <div className="details-grid">
          <div><strong>First name:</strong> {user.profileSummary?.firstName ?? '—'}</div>
          <div><strong>Last name:</strong> {user.profileSummary?.lastName ?? '—'}</div>
          <div><strong>Location:</strong> {user.profileSummary?.location ?? '—'}</div>
        </div>
      </section>

      <section className="card-block form-section">
        <h2>Statistics</h2>
        <div className="details-grid">
          <div><strong>CVs:</strong> {user.stats?.cvsCount ?? 0}</div>
          <div><strong>Projects:</strong> {user.stats?.projectsCount ?? 0}</div>
          <div><strong>Likes received:</strong> {user.stats?.likesReceivedCount ?? 0}</div>
        </div>
      </section>

      <UserRolesPanel
        currentRoles={user.roles}
        isSelf={isSelf}
        onAssignRole={(role) => assignRoleMutation.mutate(role)}
        onRemoveRole={(role) => removeRoleMutation.mutate(role)}
        isAssigning={assignRoleMutation.isPending}
        isRemoving={removeRoleMutation.isPending}
      />
    </section>
  );
}
