"use client";

import { useMentorOnlyDashboard } from "@/lib/useMentorOnlyDashboard";

export default function PublicLayout({ children }) {
  useMentorOnlyDashboard();
  return children;
}
