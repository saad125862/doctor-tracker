'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Reveal, ease } from '@/components/motion';
import { LogoMark, Wordmark } from '@/components/Logo';
import { api } from '@/lib/api';

// Inlined at build time; the API must also run with DEMO_MODE=true for the button to work
const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function quickSignIn() {
    setPending(true);
    setError('');
    try {
      await api('/auth/demo', { method: 'POST' });
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setPending(true);
    setError('');
    try {
      await api('/auth/login', { method: 'POST', body: form });
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  }

  return (
    <div className="login">
      <section className="login-hero">
        <span className="blob b1" />
        <span className="blob b2" />
        <Reveal delay={0.1}>
          <div className="brand">
            <div className="brand-mark">
              <LogoMark size={40} />
            </div>
            <Wordmark />
          </div>
        </Reveal>
        <Reveal delay={0.25}><h1>Doctors and patients, finally in one place.</h1></Reveal>
        <Reveal delay={0.4}><p>Search, filter and track every doctor and patient, with live analytics on how your network is growing.</p></Reveal>
      </section>
      <section className="login-pane">
        <motion.form
          className="card login-card"
          onSubmit={submit}
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease }}
        >
          <h2>Welcome back</h2>
          <p className="muted" style={{ margin: 0 }}>Sign in to the admin portal</p>
          {error && (
            <motion.div className="alert" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }} transition={{ duration: 0.45 }}>
              {error}
            </motion.div>
          )}
          <label className="field">
            Email
            <input className="input" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="field">
            Password
            <input className="input" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <button className="btn btn-block" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
          {DEMO && (
            <>
              <div className="or-divider"><span>or</span></div>
              <button type="button" className="btn btn-quick btn-block" onClick={quickSignIn} disabled={pending}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
                </svg>
                Quick sign in as demo admin
              </button>
            </>
          )}
        </motion.form>
      </section>
    </div>
  );
}
