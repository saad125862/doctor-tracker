'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { LogoMark, Wordmark } from '@/components/Logo';

const links = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/doctors', label: 'Doctors', icon: '🩺' },
  { href: '/patients', label: 'Patients', icon: '🧑‍🤝‍🧑' },
  { href: '/custom-fields', label: 'Custom fields', icon: '🧩' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['me'], queryFn: () => api('/auth/me'), staleTime: 5 * 60_000 });

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    qc.clear();
    router.replace('/login');
    router.refresh();
  }

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <motion.aside className="sidebar" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <div className="brand">
        <motion.div className="brand-mark" whileHover={{ rotate: -8, scale: 1.1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
          <LogoMark size={30} />
        </motion.div>
        <span className="t">
          <Wordmark />
        </span>
      </div>
      <nav className="nav">
        {links.map((l) => {
          const active = isActive(l.href);
          return (
            <Link key={l.href} href={l.href} className={active ? 'active' : ''}>
              {active && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="nav-icon" aria-hidden>{l.icon}</span>
              <span className="nav-label">{l.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <span className="who">{data?.user?.email}</span>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          Sign out
        </button>
      </div>
    </motion.aside>
  );
}
