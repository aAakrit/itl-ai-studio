/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe } from "@/hooks";
import { BridgeConnectCard } from "@/features/bridge/BridgeConnectCard";


export const Route = createFileRoute("/profile")({
  component: Profile,
  head: () => ({ meta: [{ title: "Profile — ITL AI" }] }),
});

function Profile() {
  const { data: me } = useMe();
  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account details.</p>
        <Card className="mt-8 p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full gradient-primary text-xl font-bold text-primary-foreground">
              {me?.name?.split(" ").slice(-1)[0][0] ?? "U"}
            </div>
            <div>
              <p className="text-lg font-semibold">{me?.name}</p>
              <p className="text-sm text-muted-foreground">{me?.email}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs">Name</Label>
              <Input defaultValue={me?.name} className="h-11" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Email</Label>
              <Input defaultValue={me?.email} className="h-11" />
            </div>
          </div>
          <Button className="mt-6 gradient-primary text-primary-foreground shadow-soft">Save changes</Button>
        </Card>
        <BridgeConnectCard />
      </section>
    </PublicLayout>
  );
}
