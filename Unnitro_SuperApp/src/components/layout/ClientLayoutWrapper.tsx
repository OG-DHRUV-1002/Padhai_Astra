"use client";

import { usePathname } from "next/navigation";
import { Sidebar, Role } from "@/components/layout/Sidebar";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Determine the current role layout based on the URL path
  let currentRole: Role | null = null;
  if (pathname.startsWith("/student")) {
    currentRole = "STUDENT";
  } else if (pathname.startsWith("/faculty")) {
    currentRole = "FACULTY";
  } else if (pathname.startsWith("/admin")) {
    currentRole = "ADMIN";
  }

  // Hide sidebar on landing page, login page, or any route outside of the tenant spaces
  const hideSidebar = pathname === "/" || pathname === "/login" || currentRole === null;

  return (
    <>
      {!hideSidebar && <Sidebar role={currentRole as Role} />}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </>
  );
}
