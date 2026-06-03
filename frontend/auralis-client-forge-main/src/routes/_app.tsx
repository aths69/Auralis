import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/auralis/AppShell";
import { useAuth } from "@/lib/auth";
import { getToken } from "@/lib/api";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!getToken()) navigate({ to: "/login" });
  }, [navigate]);

  if (loading && !user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="h-2 w-2 animate-pulse rounded-full bg-foreground/40" />
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
