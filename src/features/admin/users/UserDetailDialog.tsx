/* eslint-disable prettier/prettier */
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminUserDetail } from "@/hooks";
import type { AdminUserDetail } from "@/types/admin";
import { SubscriptionSection } from "./SubscriptionSection";
import { PaymentSection } from "./PaymentSection";
import { AiUsagePanel } from "./AiUsagePanel";
import { ActivitySection } from "./ActivitySection";
import {
  EMPTY,
  accountStatusClass,
  formatDateTime,
  subscriptionStatusClass,
  subscriptionStatusLabel,
} from "./admin-user-utils";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm">{value || EMPTY}</p>
    </div>
  );
}

export function UserDetailDialog({
  userId,
  onOpenChange,
  defaultTab = "overview",
}: {
  userId: number | null;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}) {
  const { data, isLoading } = useAdminUserDetail(userId);
  const user = data as AdminUserDetail | undefined;
  const role = user?.role ?? (user?.is_admin ? "Admin" : user?.is_staff ? "Staff" : "User");

  return (
    <Dialog open={userId != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {user?.name ?? "User"}
            {user && (
              <>
                <Badge className={accountStatusClass(user.status)}>{user.status}</Badge>
                <Badge variant="outline" className="capitalize">
                  {role}
                </Badge>
                {user.subscription?.id && (
                  <Badge className={subscriptionStatusClass(user.subscription.status)}>
                    {subscriptionStatusLabel(user.subscription.status)}
                  </Badge>
                )}
              </>
            )}
          </DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>

        {isLoading && !user ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !user ? (
          <p className="p-6 text-sm text-muted-foreground">Couldn't load this user.</p>
        ) : (
          <Tabs defaultValue={defaultTab} className="flex max-h-[76vh] flex-col">
            <div className="overflow-x-auto px-6 pt-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="ai">AI Usage</TabsTrigger>
                <TabsTrigger value="conversations">AI Conversations</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <TabsContent value="overview" className="m-0">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                  <Field label="Name" value={user.name} />
                  <Field label="Email" value={user.email} />
                  <Field label="Mobile" value={user.mobile} />
                  <Field label="Telephone" value={user.telephone} />
                  <Field label="Fax" value={user.fax} />
                  <Field label="Firm" value={user.firm} />
                  <Field label="Role" value={role} />
                  <Field label="Account status" value={user.status} />
                  <Field label="Approval status" value={user.status} />
                  <Field label="Approved at" value={formatDateTime(user.approved_at)} />
                  <Field label="Approved by" value={user.approved_by} />
                  <Field label="Registered" value={formatDateTime(user.created_at)} />
                  <Field label="Last login" value={formatDateTime(user.last_login)} />
                  <Field label="State" value={user.state} />
                  <Field label="City" value={user.city} />
                  <Field label="PIN code" value={user.pin_code} />
                  <div className="col-span-2 sm:col-span-3">
                    <Field label="Address" value={user.address} />
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <Field
                      label="Current plan (managed in the Subscription tab)"
                      value={user.subscription?.plan_name ?? user.plan}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="subscription" className="m-0">
                <SubscriptionSection
                  userId={user.id}
                  userName={user.name}
                  subscription={user.subscription}
                  history={user.subscription_history}
                />
              </TabsContent>

              <TabsContent value="payments" className="m-0">
                <PaymentSection payment={user.payment} />
              </TabsContent>

              <TabsContent value="ai" className="m-0">
                <AiUsagePanel usage={user.ai_usage} />
              </TabsContent>

              <TabsContent value="conversations" className="m-0">
                <p className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  Admin access to AI conversation history isn't available from the backend yet.
                </p>
              </TabsContent>

              <TabsContent value="activity" className="m-0">
                <ActivitySection userId={user.id} />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
