import AdminSidebar from "./AdminSidebar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--brand-cream)]/30 lg:flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
