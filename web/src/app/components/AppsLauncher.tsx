'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './SupabaseAuthProvider';

const apps = [
  { name: 'Promptly', icon: '🧠', href: '/promptly', status: 'Live', requiresAuth: true, requiresPatron: true },
  { name: 'Tokens', icon: '🎯', href: '#tokens', status: 'Coming soon', requiresAuth: false, requiresPatron: false },
  { name: 'Fitness', icon: '💪', href: '#fitness', status: 'Coming soon', requiresAuth: false, requiresPatron: false },
  { name: 'Diet', icon: '🥗', href: '#diet', status: 'Coming soon', requiresAuth: false, requiresPatron: false },
] as const;

export function AppsLauncher() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const stackItems = useMemo(() => apps.map((app) => ({ ...app })), []);

  return (
    <div className="apps-launcher" ref={containerRef}>
      <button
        className="apps-launcher-button"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        Apps
      </button>
      <div className={`apps-launcher-stack ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        {stackItems.map((item) => {
          const needsLogin = item.requiresAuth && !user;
          const needsPatron = item.requiresPatron && (!profile || !profile.is_patron);
          const locked = needsLogin || needsPatron;
          const href = locked
            ? needsLogin
              ? `/login?redirect=${encodeURIComponent(item.href)}`
              : `/api/patreon/link?redirect=${encodeURIComponent(item.href)}`
            : item.href;
          const statusLabel = locked
            ? needsLogin
              ? 'Login required'
              : 'Patreon required'
            : item.status;
          return (
            <Link
              key={item.name}
              href={href}
              className="apps-launcher-item"
              data-locked={locked}
              aria-disabled={locked}
            >
              <span className="apps-launcher-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="apps-launcher-label">
                {item.name}
                <small>{statusLabel}</small>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
