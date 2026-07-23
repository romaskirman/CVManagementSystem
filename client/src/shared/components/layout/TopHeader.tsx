import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useI18n } from '../../../app/providers/I18nProvider';
import { useTheme } from '../../../app/providers/ThemeProvider';
import * as React from 'react';

export function TopHeader() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [q, setQ] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="top-header">
      <div className="top-header__brand">CV Management</div>

      <form className="top-header__search" onSubmit={onSubmit}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search.placeholder}
        />
      </form>

      <div className="top-header__actions">
        <select value={locale} onChange={(e) => setLocale(e.target.value as 'en' | 'ru')}>
          <option value="en">EN</option>
          <option value="ru">RU</option>
        </select>

        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? t.theme.dark : t.theme.light}
        </button>

        {user ? (
          <button onClick={() => void signOut()}>{t.auth.logout}</button>
        ) : (
          <button onClick={() => navigate('/signin')}>{t.auth.signIn}</button>
        )}
      </div>
    </header>
  );
}
