import { Navbar } from "./Navbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 animate-fade-in">{children}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <span className="font-deva">॥ शास्त्रं कोडः तीर्थं चेतः ॥</span> · TCET Research Culture & Development Cell · © 2026
      </footer>
    </div>
  );
}
