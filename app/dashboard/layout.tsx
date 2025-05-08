import DashboardLayout from '@/components/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  // Use the DashboardLayout component only at this root level
  return <DashboardLayout>{children}</DashboardLayout>;
}