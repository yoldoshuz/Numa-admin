import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/components/layout/nav-config";

const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <DashboardShell
    groups={adminNav}
    brand={{ title: "Numa Admin", subtitle: "Панель магазина" }}
    profileHref="/admin/profile"
  >
    {children}
  </DashboardShell>
);

export default AdminLayout;
