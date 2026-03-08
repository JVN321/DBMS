"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import LandingPage from "./components/LandingPage";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, isAdmin } = useAuth();

  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (isAdmin) {
        router.push("/admin");
      } else {
        router.push("/user");
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  // Show landing page for unauthenticated visitors
  if (authLoading) return null;
  if (!isAuthenticated) return <LandingPage />;

  return null;
}
