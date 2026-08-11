"use client";

import DashboardLayout from "@/component/mentor/DashboardLayout";
import { PenyediaJudulDashboard, useJudulDashboard } from "@/lib/dashboardChrome";

/** Kerangka dashboard mentor -- lihat catatan di (dashboard)/admin/layout.jsx. */
export default function MentorDashboardLayout({ children }) {
  return (
    <PenyediaJudulDashboard>
      <Kerangka>{children}</Kerangka>
    </PenyediaJudulDashboard>
  );
}

/* Dipisah karena useJudulDashboard harus dibaca DI DALAM penyedianya. */
function Kerangka({ children }) {
  return <DashboardLayout title={useJudulDashboard()}>{children}</DashboardLayout>;
}
