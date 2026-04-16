"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { superAdminNav } from "@/components/layout/nav-config";

const SuperAdminLayout = ({ children }: { children: React.ReactNode }) => (
  <DashboardShell
    groups={superAdminNav}
    brand={{ title: "Numa", subtitle: "Super Admin" }}
    requireSuperAdmin
    profileHref="/super-admin/profile"
  >
    {children}
  </DashboardShell>
);

export default SuperAdminLayout;
