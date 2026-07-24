"use client";

import { useMentorOnlyDashboard } from "@/lib/useMentorOnlyDashboard";

export default function AuthLayout({ children }) {
  useMentorOnlyDashboard();
  return children;
}
