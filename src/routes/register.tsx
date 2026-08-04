/* eslint-disable prettier/prettier */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth.service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  component: Register,
  head: () => ({ meta: [{ title: "Create account — ITL AI" }] }),
});

const indianStates = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh",
  "Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha",
  "Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh","Andaman & Nicobar","Dadra & Nagar Haveli and Daman & Diu","Lakshadweep",
];

const schema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(80),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string().min(8),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "10-digit Indian mobile"),
    city: z.string().min(2, "Required"),
    state: z.string().min(2, "Required"),
    pincode: z.string().regex(/^\d{6}$/, "6-digit PIN"),
    firm: z.string().max(120).optional().or(z.literal("")),
    address: z.string().max(200).optional().or(z.literal("")),
    telephone: z.string().max(20).optional().or(z.literal("")),
    fax: z.string().max(20).optional().or(z.literal("")),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

type FormData = z.infer<typeof schema>;

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

function Register() {
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const password = form.watch("password") ?? "";
  const strength = useMemo(() => scorePassword(password), [password]);
  const strengthLabel = ["Weak", "Fair", "Good", "Strong", "Excellent"][strength];
  const strengthColor = [
    "bg-destructive",
    "bg-warning",
    "bg-warning",
    "bg-success",
    "bg-success",
  ][strength];

  async function onSubmit(values: FormData) {
    await authService.register({
      name: values.name,
      email: values.email,
      password: values.password,
      mobile: values.mobile,
      city: values.city,
      state: values.state,
      pincode: values.pincode,
      firm: values.firm || undefined,
      address: values.address,
      telephone: values.telephone || undefined,
      fax: values.fax || undefined,
    });
    toast.success("Account created. Verify your email to continue.");
    nav({ to: "/login", });
  }

  const submitting = form.formState.isSubmitting;
  const err = form.formState.errors;

  return (
    <AuthLayout
      title="Create your workspace."
      subtitle="Start free. No credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Account
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="mb-1.5 block text-xs">Full name *</Label>
              <Input placeholder="Your full name" className="h-11" {...form.register("name")} />
              {err.name && <p className="mt-1 text-[11px] text-destructive">{err.name.message}</p>}
            </div>
            <div className="col-span-2">
              <Label className="mb-1.5 block text-xs">Work email *</Label>
              <Input type="email" placeholder="you@firm.in" className="h-11" {...form.register("email")} />
              {err.email && <p className="mt-1 text-[11px] text-destructive">{err.email.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Password *</Label>
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  placeholder="At least 8 characters"
                  className="h-11 pr-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          i < strength ? strengthColor : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Strength: {strengthLabel}
                  </p>
                </div>
              )}
              {err.password && <p className="mt-1 text-[11px] text-destructive">{err.password.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Confirm password *</Label>
              <Input
                type={show ? "text" : "password"}
                placeholder="Retype password"
                className="h-11"
                {...form.register("confirm")}
              />
              {err.confirm && <p className="mt-1 text-[11px] text-destructive">{err.confirm.message}</p>}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Contact
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs">Mobile *</Label>
              <Input placeholder="10-digit mobile" className="h-11" {...form.register("mobile")} />
              {err.mobile && <p className="mt-1 text-[11px] text-destructive">{err.mobile.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">PIN Code *</Label>
              <Input placeholder="6-digit PIN" className="h-11" {...form.register("pincode")} />
              {err.pincode && <p className="mt-1 text-[11px] text-destructive">{err.pincode.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">City *</Label>
              <Input placeholder="City" className="h-11" {...form.register("city")} />
              {err.city && <p className="mt-1 text-[11px] text-destructive">{err.city.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">State *</Label>
              <select
                {...form.register("state")}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select state</option>
                {indianStates.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {err.state && <p className="mt-1 text-[11px] text-destructive">{err.state.message}</p>}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Firm details (optional)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="mb-1.5 block text-xs">Company / Firm name</Label>
              <Input placeholder="Firm name" className="h-11" {...form.register("firm")} />
            </div>
            <div className="col-span-2">
              <Label className="mb-1.5 block text-xs">Address *</Label>
              <Input placeholder="Office address" className="h-11" {...form.register("address")} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Telephone</Label>
              <Input placeholder="Office phone" className="h-11" {...form.register("telephone")} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Fax</Label>
              <Input placeholder="Fax" className="h-11" {...form.register("fax")} />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-xl gradient-primary text-primary-foreground shadow-soft"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" /> Create account
            </>
          )}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          By continuing you agree to our{" "}
          <Link to="/terms" className="underline">Terms</Link> and{" "}
          <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>
    </AuthLayout>
  );
}
