import { Navbar } from "./Navbar";

interface AppLayoutProps {
  children: React.ReactNode;
  hideNavbar?: boolean;
  hideFooter?: boolean;
}

export function AppLayout({
  children,
  hideNavbar = false,
  hideFooter = false,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!hideNavbar && <Navbar />}
      <main className="flex-1 animate-fade-in">{children}</main>
      {!hideFooter && (
        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          TCET Research Culture & Development Cell · © 2026
        </footer>
      )}
    </div>
  );
}
