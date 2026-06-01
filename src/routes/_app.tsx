import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background pb-24">
      <Outlet />
      <BottomNav />
    </div>
  );
}
