/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authService } from "@/services/auth.service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/forgot-password")({
  component: Forgot,
  head: () => ({ meta: [{ title: "Reset password — ITL AI" }] }),
});

type Step = "email" | "otp" | "password" | "done";

function Forgot() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp() {
    setError(null);
    if (!z.string().email().safeParse(email).success) {
      setError("Enter a valid email.");
      return;
    }
    setBusy(true);
    try {
      await authService.requestPasswordOtp(email);
      setStep("otp");
      toast.success("If that email is registered, a code has been sent.");
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Couldn't send the code — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setError(null);
    setBusy(true);
    try {
      const r = await authService.verifyPasswordOtp(email, otp);
      if (!r.ok) {
        setError("Invalid or expired OTP.");
        return;
      }
      setStep("password");
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Couldn't verify that code — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitPassword() {
    setError(null);
    if (pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (pw !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await authService.resetPassword(email, otp, pw);
      setStep("done");
      toast.success("Password updated");
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Couldn't update your password — the code may have expired.");
    } finally {
      setBusy(false);
    }
  }

  const steps = ["email", "otp", "password", "done"] as const;
  const activeIdx = steps.indexOf(step);

  return (
    <AuthLayout
      title="Reset your password."
      subtitle={
        step === "email"
          ? "We'll email you a 6-digit code."
          : step === "otp"
            ? `Enter the code sent to ${email}.`
            : step === "password"
              ? "Choose a strong new password."
              : "You're all set."
      }
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <div className="mb-4 flex items-center gap-2">
        {steps.slice(0, 3).map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= activeIdx ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      {step === "email" && (
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs">Work email</Label>
            <Input
              type="email"
              placeholder="you@firm.in"
              className="h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            onClick={requestOtp}
            disabled={busy}
            className="h-11 w-full rounded-xl gradient-primary text-primary-foreground shadow-soft"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send reset code
          </Button>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="h-12 w-12" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button
            onClick={verifyOtp}
            disabled={busy || otp.length !== 6}
            className="h-11 w-full rounded-xl gradient-primary text-primary-foreground shadow-soft"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Verify code
          </Button>
          <button
            onClick={requestOtp}
            className="w-full text-center text-xs font-semibold text-primary hover:underline"
          >
            Resend code
          </button>
        </div>
      )}

      {step === "password" && (
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs">New password</Label>
            <Input
              type="password"
              placeholder="At least 8 characters"
              className="h-11"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Confirm password</Label>
            <Input
              type="password"
              className="h-11"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button
            onClick={submitPassword}
            disabled={busy}
            className="h-11 w-full rounded-xl gradient-primary text-primary-foreground shadow-soft"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update password
          </Button>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-4 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-success/10 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm">Your password has been updated.</p>
          <Button
            onClick={() => nav({ to: "/login" })}
            className="h-11 w-full rounded-xl gradient-primary text-primary-foreground shadow-soft"
          >
            Sign in
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
