// app/(dashboard)/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { hasCapability, type Role, type Capability } from "@/auth/permissions";
import { NavLinks, type NavItem } from "@/components/layout/NavLinks";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavConfigItem {
  href: string;
  label: string;
  id: string;
  capability: Capability;
}

const NAV_CONFIG: NavConfigItem[] = [
  {
    href: "/schedule",
    label: "Schedule",
    id: "nav-schedule",
    capability: "SCHEDULE_VIEW",
  },
  {
    href: "/attendance",
    label: "Attendance",
    id: "nav-attendance",
    capability: "ATTENDANCE_VIEW",
  },
  {
    href: "/employees",
    label: "Employees",
    id: "nav-employees",
    capability: "ACCOUNTS_VIEW",
  },
  {
    href: "/working-place-codes",
    label: "Working-Place Codes",
    id: "nav-working-place-codes",
    capability: "WORKING_PLACE_CODES_VIEW",
  },
  {
    href: "/exports",
    label: "Exports",
    id: "nav-exports",
    capability: "EXPORTS_VIEW",
  },
  {
    href: "/modification-requests",
    label: "Modification Requests",
    id: "nav-modification-requests",
    capability: "MODIFICATION_REQUESTS_VIEW",
  },
];

const ROLE_BADGE_STYLES: Record<Role, { label: string; badgeClass: string }> = {
  GRH: {
    label: "GRH",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  MANAGER: {
    label: "Manager",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
  ADMIN: {
    label: "Admin",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  SUPERVISOR: {
    label: "Supervisor",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  OPERATOR: {
    label: "Operator",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
  },
  OPERATOR_PILOT: {
    label: "Operator Pilot",
    badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth();

  // Auth guard: unauthenticated requests are redirected immediately to /login
  if (!session?.user?.role) {
    redirect("/login");
  }

  const role = session.user.role as Role;

  // Filter navigation links strictly through hasCapability
  const visibleNavItems: NavItem[] = NAV_CONFIG.filter((item) =>
    hasCapability(role, item.capability)
  ).map(({ href, label, id }) => ({ href, label, id }));

  const roleMeta = ROLE_BADGE_STYLES[role] ?? {
    label: role,
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
      {/* Role-Aware Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand / System Identity */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 font-semibold text-slate-900 tracking-tight">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
                  AP
                </span>
                <span className="hidden sm:inline-block text-base font-bold">
                  Amusement Park System
                </span>
              </div>

              {/* Dynamic Role-Filtered Navigation Links */}
              <nav
                className="hidden md:flex items-center space-x-1"
                aria-label="Main Navigation"
              >
                <NavLinks items={visibleNavItems} />
              </nav>
            </div>

            {/* User Session Info, Role Badge & Logout */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-right">
                <span
                  className="text-xs sm:text-sm font-medium text-slate-700 hidden sm:inline-block"
                  id="nav-user-name"
                >
                  {session.user.name || "Authenticated User"}
                </span>
                <span
                  id="nav-user-role-badge"
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${roleMeta.badgeClass}`}
                >
                  {roleMeta.label}
                </span>
              </div>

              <div className="h-5 w-px bg-slate-200" aria-hidden="true" />

              {/* Logout Action */}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  id="nav-logout-btn"
                  className="inline-flex items-center justify-center rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>

          {/* Mobile Navigation Bar */}
          <div className="md:hidden flex overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
            <NavLinks items={visibleNavItems} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
