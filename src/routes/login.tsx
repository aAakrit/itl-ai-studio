/* eslint-disable prettier/prettier */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { authService } from "@/services/auth.service";
import { cn } from "@/lib/utils";
import { useIsBridgeProduct } from "@/features/bridge/useBridgeProduct";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Sign in — ITL AI" }] }),
});

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  remember: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

function Login() {
  const nav = useNavigate();
  const bridge = useIsBridgeProduct();
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { remember: true },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => setCaps(e.getModifierState?.("CapsLock") ?? false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  async function onSubmit(values: FormData) {
    setError(null);
    try {
      await authService.login(values.email, values.password, values.remember ?? false);
      toast.success("Signed in");
      // The ITL Bridge AI Allow page sends people here with ?redirect=<its own URL>
      // so they come back to it (txn / return_url intact). Only that one path is honoured.
      const next = new URLSearchParams(window.location.search).get("redirect");
      if (next && next.startsWith("/ai-connect/allow")) {
        window.location.assign(next);
        return;
      }
      // Bridge customers land on their account page (plan + Connect buttons).
      nav({ to: bridge ? "/profile" : "/workspace" });
    } catch {
      setError("Invalid email or password.");
    }
  }

  const submitting = form.formState.isSubmitting;

  return (
    <AuthLayout
      variant={bridge ? "bridge" : "ai"}
      title="Welcome back."
      subtitle={bridge ? "Sign in with your ITL account to connect your AI." : "Sign in to your ITL AI workspace."}
      footer={
        bridge ? (
          <>
            New to ITL Bridge AI?{" "}
            <a href="/register?product=bridge" className="font-semibold text-primary hover:underline">
              Create an account
            </a>
          </>
        ) : (
          <>
            New to ITL AI?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </>
        )
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
        <div>
          <Label className="mb-1.5 block text-xs">Work email</Label>
          <Input
            type="email"
            placeholder="you@firm.in"
            className="h-11"
            autoComplete="email"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="mt-1 text-[11px] text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="text-xs">Password</Label>
            <Link to="/forgot-password" className="text-[11px] font-medium text-primary hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              placeholder="••••••••"
              className="h-11 pr-11"
              autoComplete="current-password"
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="mt-1 text-[11px] text-destructive">{form.formState.errors.password.message}</p>
          )}
          {caps && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-warning">
              <Info className="h-3 w-3" /> Caps Lock is on
            </p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.watch("remember") ?? false}
            onCheckedChange={(v) => form.setValue("remember", !!v)}
          />
          Remember me on this device
        </label>
        <Button
          type="submit"
          disabled={submitting}
          className={cn("h-11 w-full rounded-xl gradient-primary text-primary-foreground shadow-soft")}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
