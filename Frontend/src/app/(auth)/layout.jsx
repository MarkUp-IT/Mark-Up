"use client";

import { useDashboardOnlyGuard } from "@/lib/useDashboardOnlyGuard";

export default function AuthLayout({ children }) {
  useDashboardOnlyGuard();
  return children;
}
