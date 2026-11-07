'use client';
import { memo, useState } from 'react';
import Link from 'next/link';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { CountUp, InView, itemVariants, listVariants } from '@/components/motion';
import { api } from '@/lib/api';
import { formatDate, initials } from '@/lib/format';
import { ErrorState, Skeleton } from '@/components/ui';

const COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#0ea5e9', '#84cc16'];
const shortDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

const StatCard = memo(function StatCard({ icon, label, value, delta, decimals = 0 }) {
  return (
    <motion.div className="card stat lift" variants={itemVariants} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
      <div className="icon">{icon}</div>
      <div>
        <div className="label">{label}</div>
        <div className="value">{value == null ? <Skeleton h={30} w={70} /> : <CountUp value={value} decimals={decimals} />}</div>
        {delta != null && <div className="delta">{delta}</div>}
      </div>
    </motion.div>
  );
});

const GrowthChart = memo(function GrowthChart({ data }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12 }} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip labelFormatter={shortDate} />
          <Area type="monotone" dataKey="patients" name="New patients" stroke="#0d9488" strokeWidth={2} fill="url(#gp)" />
          <Area type="monotone" dataKey="doctors" name="New doctors" stroke="#6366f1" strokeWidth={2} fill="url(#gd)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

const PerDoctorChart = memo(function PerDoctorChart({ data }) {
  return (
    <div className="chart-box" style={{ height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} />
          <Bar dataKey="patients" name="Patients" fill="#0d9488" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

const Donut = memo(function Donut({ data }) {
  return (
    <>
      <div className="chart-box" style={{ height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="legend">
        {data.map((d, i) => (
          <span key={d.name}>
            <i style={{ background: COLORS[i % COLORS.length] }} />
            {d.name} ({d.value})
          </span>
        ))}
      </div>
    </>
  );
});

export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const { data, error, isLoading } = useQuery({
    queryKey: ['dashboard', days],
    queryFn: () => api('/dashboard/stats', { params: { days } }),
    placeholderData: keepPreviousData,
  });
  const t = data?.totals;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your doctors and patients</p>
        </div>
        <label className="field" style={{ minWidth: 160 }}>
          Period
          <select className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </label>
      </div>

      {error && <ErrorState error={error} />}

      <motion.div className="stats" variants={listVariants} initial="hidden" animate="show">
        <StatCard icon="🩺" label="Total doctors" value={t?.doctors} delta={t && `+${t.newDoctors} in period`} />
        <StatCard icon="🧑‍🤝‍🧑" label="Total patients" value={t?.patients} delta={t && `+${t.newPatients} in period`} />
        <StatCard icon="⚖️" label="Avg patients / doctor" value={t?.avgPatientsPerDoctor} decimals={1} />
        <StatCard icon="📈" label={`New patients (${days}d)`} value={t?.newPatients} />
      </motion.div>

      <div className="grid-2">
        <InView delay={0.05} className="card card-pad lift">
          <h3>Growth over time</h3>
          <div className="sub">New patients and doctors per day</div>
          {isLoading ? <Skeleton h={280} /> : <GrowthChart data={data.timeline} />}
        </InView>
        <InView delay={0.12} className="card card-pad lift">
          <h3>Top conditions</h3>
          <div className="sub">Most common patient conditions</div>
          {isLoading ? <Skeleton h={280} /> : <Donut data={data.conditions} />}
        </InView>
      </div>

      <div className="grid-2">
        <InView className="card card-pad lift">
          <h3>Patients per doctor</h3>
          <div className="sub">Top 10 doctors by patient count</div>
          {isLoading ? <Skeleton h={320} /> : <PerDoctorChart data={data.patientsPerDoctor} />}
        </InView>
        <InView delay={0.1} className="card card-pad lift">
          <h3>Recently added patients</h3>
          <div className="sub">Latest registrations</div>
          {isLoading ? (
            <Skeleton h={200} />
          ) : (
            <motion.ul className="recent" variants={listVariants} initial="hidden" animate="show">
              {data.recentPatients.map((p) => (
                <motion.li key={p._id} variants={itemVariants}>
                  <div className="avatar">{initials(p.name)}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {p.condition} · {p.doctor?.name} · {formatDate(p.createdAt)}
                    </div>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}
          <Link href="/patients" className="btn btn-ghost btn-sm" style={{ marginTop: 16 }}>
            View all patients
          </Link>
        </InView>
      </div>
    </>
  );
}
