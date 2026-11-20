/* eslint-disable prettier/prettier */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { WorkspaceGate } from "@/features/workspace/WorkspaceGate";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/workspace")({
  // The workspace previously had no auth guard at all — an unauthenticated
  // visitor could land here and every /ai/* call would silently 401.
  // `useAuthStore` is read directly (not via a hook) because `beforeLoad`
  // runs outside React's render cycle.
  beforeLoad: () => {
    const { token } = useAuthStore.getState();
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  component: WorkspaceGate,
  head: () => ({ meta: [{ title: "Workspace — ITL AI" }, { name: "description", content: "Your AI workspace for Income Tax and GST research." }] }),
});