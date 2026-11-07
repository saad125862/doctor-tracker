import Sidebar from '@/components/Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className="shell">
      <Sidebar />
      <main className="content">{children}</main>
    </div>
  );
}
