'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';

const baseApps = [
  { name: 'Promptly', icon: '🧠', href: '/promptly', status: 'Live' },
  { name: 'Tokens', icon: '🎯', href: '#tokens', status: 'Coming soon' },
  { name: 'Fitness', icon: '💪', href: '#fitness', status: 'Coming soon' },
  { name: 'Diet', icon: '🥗', href: '#diet', status: 'Coming soon' },
];

export function AppsLauncher() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const stackItems = useMemo(() => {
    const items = [...baseApps];
    const redirect = pathname && pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : '';
    items.push({ name: 'Account', icon: '👤', href: `/account${redirect}`, status: user ? 'Access' : 'Sign in' });
    return items;
  }, [user, pathname]);

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
        {stackItems.map((item) =>
          item.name === 'Logout' ? (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                router.push('/login');
              }}
              className="apps-launcher-item"
            >
              <span className="apps-launcher-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="apps-launcher-label">
                {item.name}
                <small>{item.status}</small>
              </span>
            </button>
          ) : (
            <Link key={item.name} href={item.href} className="apps-launcher-item">
              <span className="apps-launcher-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="apps-launcher-label">
                {item.name}
                <small>{item.status}</small>
              </span>
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
