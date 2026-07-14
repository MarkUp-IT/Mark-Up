import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ title, children }) {
  return (
    <div
      style={{ backgroundColor: "#0F081C" }}
      className="w-full min-h-screen font-inter text-white"
    >
      <div className="fixed inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%]"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
      </div>
      <Sidebar />

      {/* Sebelumnya lg:ml-[288px] -- prefix responsive kayak gini yang
          berkali-kali ketauan nggak ke-compile di project ini. Sidebar-nya
          fixed dan dashboard ini emang didesain buat desktop, jadi margin
          dipaksa selalu aktif lewat inline style, nggak digantung breakpoint. */}
      <div
        style={{ marginLeft: "288px" }}
        className="flex flex-col min-h-screen"
      >
        <Header title={title} />

        <main className="flex-1 py-8 px-8">
          <div
            style={{ maxWidth: "1158px" }}
            className="w-full mx-auto flex flex-col gap-6"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
