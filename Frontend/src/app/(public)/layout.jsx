"use client";

import { useDashboardOnlyGuard } from "@/lib/useDashboardOnlyGuard";

export default function PublicLayout({ children }) {
  useDashboardOnlyGuard();
  return children;
}
