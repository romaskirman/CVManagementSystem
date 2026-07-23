import { UserRole } from '../../../shared/api/admin.api';
import * as React from 'react';

type UserRolesPanelProps = {
  currentRoles: UserRole[];
  isSelf: boolean;
  onAssignRole: (role: UserRole) => void;
  onRemoveRole: (role: UserRole) => void;
  isAssigning?: boolean;
  isRemoving?: boolean;
};

const ALL_ROLES: UserRole[] = ['CANDIDATE', 'RECRUITER', 'ADMIN'];

export function UserRolesPanel({
  currentRoles,
  isSelf,
  onAssignRole,
  onRemoveRole,
  isAssigning = false,
  isRemoving = false
}: UserRolesPanelProps) {
  return (
    <section className="card-block form-section">
      <div className="section-header-inline">
        <h2>Roles</h2>
        {isSelf && <span className="warning-text">You are editing your own account</span>}
      </div>

      <div className="stack-list">
        {ALL_ROLES.map((role) => {
          const hasRole = currentRoles.includes(role);

          return (
            <div key={role} className="inline-editor-row">
              <div>
                <strong>{role}</strong>
                {isSelf && role === 'ADMIN' && (
                  <div className="warning-text">
                    You cannot remove your own Administrator role.
                  </div>
                )}
              </div>

              {hasRole ? (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => onRemoveRole(role)}
                  disabled={isRemoving || (isSelf && role === 'ADMIN')}
                >
                  Remove role
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onAssignRole(role)}
                  disabled={isAssigning}
                >
                  Assign role
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
