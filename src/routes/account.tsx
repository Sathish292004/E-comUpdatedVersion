import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingBag, Heart, LogOut, LogIn, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/lib/store/AppContext";
import { cn } from "@/lib/format";
import { profileApi } from "@/lib/api/profile";

export const Route = createFileRoute("/account")({ component: AccountLayout });

const links = [
  { to: "/account", label: "Profile", icon: LayoutDashboard },
  { to: "/account/orders", label: "Orders", icon: ShoppingBag },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
];

function AccountLayout() {
  const { user, logout, authReady } = useApp();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.get,
    enabled: !!user,
    retry: false,
  });

  if (!authReady) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Restoring your session…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-3xl font-black">My account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please sign in to view your profile, orders and saved items.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            to="/auth/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-cta px-5 py-3 text-sm font-bold text-white shadow-glow"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </Link>
          <Link
            to="/auth/register"
            className="inline-flex items-center justify-center gap-2 rounded-full border bg-background px-5 py-3 text-sm font-semibold hover:bg-secondary"
          >
            <UserPlus className="h-4 w-4" />
            Create account
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile.data?.name ?? user.name;
  const displayEmail = profile.data?.email ?? user.email;
  const initials = displayName
    ? displayName
        .split(" ")
        .filter(Boolean)
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  const onSignOut = () => {
    logout();
    navigate({ to: "/auth/login", replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black sm:text-4xl">My account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your profile, orders and saved items.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border bg-card p-5 shadow-card lg:sticky lg:top-24 self-start">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-white">
              {profile.isLoading && !profile.data ? "…" : initials || "•"}
            </div>
            <div className="min-w-0">
              {profile.isLoading && !profile.data ? (
                <>
                  <div className="h-3 w-28 animate-pulse rounded bg-secondary" />
                  <div className="mt-1.5 h-2.5 w-36 animate-pulse rounded bg-secondary" />
                </>
              ) : (
                <>
                  <p className="line-clamp-1 text-sm font-bold">{displayName}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{displayEmail}</p>
                </>
              )}
            </div>
          </div>
          <nav className="mt-5 space-y-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition", path === l.to ? "bg-gradient-primary text-white shadow-soft" : "hover:bg-secondary")}>
                <l.icon className="h-4 w-4" />{l.label}
              </Link>
            ))}
            <button onClick={onSignOut} className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" />Sign out</button>
          </nav>
        </aside>
        <div><Outlet /></div>
      </div>
    </div>
  );
}
