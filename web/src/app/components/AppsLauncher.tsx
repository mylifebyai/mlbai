'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useProfileRole } from '../hooks/useProfileRole';

const apps = [
  { name: 'Promptly', icon: '🧠', href: '/promptly', status: 'Live' },
  { name: 'Tokens', icon: '🎯', href: '#tokens', status: 'Coming soon' },
  { name: 'Fitness', icon: '💪', href: '#fitness', status: 'Coming soon' },
  { name: 'Diet', icon: '🥗', href: '#diet', status: 'Coming soon' },
  { name: 'Feedback', icon: '🐞', href: '/feedback', status: 'Testing' },
  { name: 'Analytics', icon: '📈', href: '/analytics', status: 'Internal' },
];

export function AppsLauncher() {
  const { user } = useAuth();
  const { role } = useProfileRole(user?.id);
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

  const stackItems = useMemo(() => apps.map((app) => ({ ...app })), []);

  const filteredItems = useMemo(() => {
    return stackItems.filter((item) => {
      if (item.name === 'Analytics' && role !== 'admin') return false;
      if (item.name === 'Feedback' && role !== 'admin' && role !== 'tester') return false;
      return true;
    });
  }, [stackItems, role]);

  if (!role) {
    return null;
  }

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
        {filteredItems.map((item) => (
          <Link key={item.name} href={item.href} className="apps-launcher-item">
            <span className="apps-launcher-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="apps-launcher-label">
              {item.name}
              <small>{item.status}</small>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
