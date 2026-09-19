"use client";

import DashboardLayout from "@/component/user/DashboardLayout";
import { PenyediaJudulDashboard, useJudulDashboard } from "@/lib/dashboardChrome";

/** Kerangka dashboard student -- lihat catatan di (dashboard)/admin/layout.jsx. */
export default function UserDashboardLayout({ children }) {
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
