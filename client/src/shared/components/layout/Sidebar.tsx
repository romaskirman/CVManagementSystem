import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import * as React from 'react';

type NavItem = {
  to: string;
  label: string;
  public?: boolean;
  roles?: string[];
};

const navItems: NavItem[] = [
  { to: '/', label: 'Home', public: true },
  { to: '/positions', label: 'Positions', public: true },
  { to: '/profile', label: 'My profile', roles: ['CANDIDATE'] },
  { to: '/projects', label: 'My projects', roles: ['CANDIDATE'] },
  { to: '/cvs', label: 'My CVs', roles: ['CANDIDATE'] },
  { to: '/recruiter/attributes', label: 'Attributes', roles: ['RECRUITER', 'ADMIN'] },
  { to: '/recruiter/positions/new', label: 'New position', roles: ['RECRUITER', 'ADMIN'] },
  { to: '/admin/users', label: 'Users', roles: ['ADMIN'] }
];

export function Sidebar() {
  const { user, isAuthenticated } = useAuth();

  const visibleItems = navItems.filter((item) => {
    if (item.public) {
      return true;
    }

    if (!isAuthenticated || !user) {
      return false;
    }

    if (!item.roles?.length) {
      return true;
    }

    return item.roles.some((role) => user.roles.includes(role));
  });

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
