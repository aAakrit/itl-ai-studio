/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { Loader2, Lock } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMyAccess } from "@/hooks/useAccess";
import { WorkspaceShell } from "./WorkspaceShell";

/**
 * The ITL AI workspace is for admins, staff and customers whose plan includes ITL AI.
 * Customers on an ITL Bridge AI-only plan use the connectors from their account page instead.
 * (The server enforces this too — every /ai/* call is refused without access.)
 */
export function WorkspaceGate() {
  const { data, isLoading } = useMyAccess();

  if (isLoading) {
    return (
      <div className="grid h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If the access check itself fails we still open the workspace — the server will refuse what isn't allowed.
  if (!data || data.workspace) return <WorkspaceShell />;

  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <Card className="w-full p-8 shadow-soft">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-xl font-bold">The ITL AI workspace isn't in your plan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.bridge
              ? "Your ITL Bridge AI plan gives you GST AI and Income Tax AI inside Claude, ChatGPT and Gemini. The web workspace needs an ITL AI plan."
              : "You don't have an active plan yet. Choose a plan to get started."}
          </p>
          <div className="mt-6 grid gap-2">
            {data.bridge && (
              <Button asChild className="h-11 rounded-xl gradient-primary text-primary-foreground">
                <Link to="/profile">Connect my AI apps</Link>
              </Button>
            )}
            <Button asChild variant={data.bridge ? "outline" : "default"} className="h-11 rounded-xl">
              <Link to="/pricing">View plans</Link>
            </Button>
          </div>
        </Card>
      </section>
    </PublicLayout>
  );
}
