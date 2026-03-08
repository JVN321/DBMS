"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";

export default function MainWrapper({ children }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // No sidebar padding on landing page (root when not authenticated) or login
  const isLanding = pathname === "/" && !isAuthenticated;
  const isLogin = pathname === "/login";
  const needsSidebarPadding = !isLanding && !isLogin;

  return (
    <main className={`${needsSidebarPadding ? "lg:pl-64" : ""} relative z-10 pointer-events-none`}>
      <div className="min-h-screen pointer-events-auto">{children}</div>
    </main>
  );
}
