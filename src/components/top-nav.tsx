import { Link, useRouter } from "@tanstack/react-router";
import { Flame, LogOut, LayoutDashboard, Briefcase, Upload, FileLock2 } from "lucide-react";
import { useApp, type Role } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ROLE_LABEL: Record<Exclude<Role, null>, string> = {
  investor: "Investor",
  developer: "Developer",
  admin: "BKPM Admin",
};

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <span
        className="relative flex items-center justify-center rounded-lg vela-gradient shadow-lg shadow-primary/30"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <Flame className="text-white" size={size * 0.6} strokeWidth={2.5} />
      </span>
      <span className="text-2xl font-bold tracking-tight lowercase vela-gradient-text">vela</span>
    </Link>
  );
}

export function TopNav() {
  const { role, setRole } = useApp();
  const router = useRouter();

  if (!role) {
    return (
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Indonesia Investment Intelligence</div>
        </div>
      </header>
    );
  }

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/projects", label: "Projects", icon: Briefcase },
    { to: "/upload", label: "Upload", icon: Upload },
    { to: "/data-rooms", label: "Data Rooms", icon: FileLock2 },
  ] as const;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center gap-8">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: "bg-primary/15 text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground hover:bg-secondary/60" }}
              className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/15 text-foreground ring-1 ring-primary/30">
            <span className="w-1.5 h-1.5 rounded-full bg-teal" />
            {ROLE_LABEL[role]}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRole(null);
              toast.success("Signed out");
              router.navigate({ to: "/" });
            }}
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
