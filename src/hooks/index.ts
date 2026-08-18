/* eslint-disable prettier/prettier */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { homeService } from "@/services/home.service";
import { aboutService } from "@/services/about.service";
import { pricingService } from "@/services/pricing.service";
import { faqService } from "@/services/faq.service";
import { contactService } from "@/services/contact.service";
import { workspaceService, chatService } from "@/services/workspace.service";
import { adminService, analyticsService, subscriptionService, userService } from "@/services/admin.service";
import { legalService } from "@/services/legal.service";
import { cmsContentService, cmsService, navigationService } from "@/services/cms.service";
import { featureService } from "@/services/features.service";
import { permissionService } from "@/services/permissions.service";
import { notificationService } from "@/services/notifications.service";
import { searchService } from "@/services/search.service";
import { globalSettingsService } from "@/services/settings.service";
import { widgetService } from "@/services/widgets.service";
import { formService } from "@/services/forms.service";

/* Existing (preserved) */
export const useHome = () => useQuery({ queryKey: ["home"], queryFn: () => homeService.getHome() });
export const useAbout = () => useQuery({ queryKey: ["about"], queryFn: () => aboutService.getAbout() });
export const usePricing = () => useQuery({ queryKey: ["pricing"], queryFn: () => pricingService.getPlans() });
export const useFAQ = () => useQuery({ queryKey: ["faq"], queryFn: () => faqService.getFaqs() });
export const useContact = () => useQuery({ queryKey: ["contact"], queryFn: () => contactService.getInfo() });

export const useWorkspaceModules = () =>
  useQuery({ queryKey: ["workspace", "modules"], queryFn: () => workspaceService.getModules() });
export const usePromptSuggestions = (moduleId?: string) =>
  useQuery({ queryKey: ["workspace", "suggestions", moduleId], queryFn: () => workspaceService.getSuggestions(moduleId) });
export const useChatThreads = (moduleId: string, toolId: string) =>
  useQuery({
    queryKey: ["chat", "threads", moduleId, toolId],
    queryFn: () => chatService.listThreads(moduleId, toolId),
  });
export const useChatFolders = () =>
  useQuery({ queryKey: ["chat", "folders"], queryFn: () => workspaceService.getFolders() });

const ADMIN_STALE = 5 * 60_000;
export const useAdminMetrics = () => useQuery({ queryKey: ["admin", "metrics"], queryFn: () => adminService.getMetrics(), staleTime: ADMIN_STALE });
export const useAdminUsers = (params: UserListParams,) => useQuery({ queryKey: ["admin", "users", params], queryFn: () => adminService.getUsers(params), staleTime: ADMIN_STALE, placeholderData: keepPreviousData,});

export const useAdminUserDetail = (id: number | null) =>
  useQuery({
    queryKey: ["admin", "users", "detail", id],
    queryFn: () => adminService.getUser(id!),
    enabled: id != null,
  });

export const useAdminUserHistory = (
  id: number | null,
  params?: { page?: number; limit?: number },
) =>
  useQuery({
    queryKey: ["admin", "users", "history", id, params],
    queryFn: () => adminService.getUserHistory(id!, params),
    enabled: id != null,
    placeholderData: keepPreviousData,
  });

function useAdminUserMutation<T = void>(mutationFn: (id: number, arg: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, arg }: { id: number; arg: T }) => mutationFn(id, arg),
    onSuccess: () => {
      // Every action (approve/suspend/delete/update) changes what the list
      // and the detail view should show — invalidate both broadly rather
      // than trying to patch the cache by hand.
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

type ReasonArg = { reason?: string } | undefined;

export const useApproveUser = () =>
  useAdminUserMutation<ReasonArg>((id, arg) => adminService.approveUser(id, arg?.reason));
export const useSuspendUser = () =>
  useAdminUserMutation<ReasonArg>((id, arg) => adminService.suspendUser(id, arg?.reason));
export const useDeleteUser = () =>
  useAdminUserMutation<ReasonArg>((id, arg) => adminService.deleteUser(id, arg?.reason));
export const useUpdateUser = () =>
  useAdminUserMutation<Record<string, unknown>>((id, patch) => adminService.updateUser(id, patch));

/* ---------- Admin subscriptions ---------- */

export const useAdminSubscriptions = (params: SubscriptionListParams) =>
  useQuery({
    queryKey: ["admin", "subscriptions", params],
    queryFn: () => subscriptionService.list(params),
    placeholderData: keepPreviousData,
  });

export const useAdminSubscription = (id: number | null) =>
  useQuery({
    queryKey: ["admin", "subscriptions", "detail", id],
    queryFn: () => subscriptionService.get(id!),
    enabled: id != null,
  });

/**
 * Every subscription mutation invalidates users + subscriptions so the list,
 * the user detail and any subscription view all reflect the new state.
 */
function useSubscriptionMutation<TVars>(mutationFn: (vars: TVars) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
    },
  });
}

export const useCreateManualSubscription = () =>
  useSubscriptionMutation((payload: SubscriptionCreateManual) =>
    subscriptionService.createManual(payload),
  );

export const useUpdateSubscription = () =>
  useSubscriptionMutation(({ id, patch }: { id: number; patch: SubscriptionUpdate }) =>
    subscriptionService.update(id, patch),
  );

export const useExtendSubscription = () =>
  useSubscriptionMutation(({ id, payload }: { id: number; payload: SubscriptionExtend }) =>
    subscriptionService.extend(id, payload),
  );

export const useSuspendSubscription = () =>
  useSubscriptionMutation(({ id, reason }: { id: number; reason?: string }) =>
    subscriptionService.suspend(id, reason),
  );

export const useCancelSubscription = () =>
  useSubscriptionMutation(({ id, reason }: { id: number; reason?: string }) =>
    subscriptionService.cancel(id, reason),
  );

export const useActivateSubscription = () =>
  useSubscriptionMutation(({ id, reason }: { id: number; reason?: string }) =>
    subscriptionService.activate(id, reason),
  );


export const useAdminNav = () => useQuery({ queryKey: ["admin", "nav"], queryFn: () => adminService.getNav(), staleTime: Infinity });
export const useAnalytics = () => useQuery({ queryKey: ["analytics"], queryFn: () => analyticsService.getOverview(), staleTime: ADMIN_STALE });

export const useAiAnalytics = (params?: { start_date?: string; end_date?: string }) =>
  useQuery({
    queryKey: ["admin", "ai-analytics", params],
    queryFn: () => analyticsService.getAiAnalytics(params),
    staleTime: ADMIN_STALE,
  });

export const useAiHealth = () =>
  useQuery({
    queryKey: ["admin", "ai-health"],
    queryFn: () => analyticsService.getAiHealth(),
    // A live status check, not cached data — keep it reasonably fresh
    // while the admin has this page open.
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
export const useMe = (enabled = true) => useQuery({ queryKey: ["me"], queryFn: () => userService.me(), enabled, staleTime: ADMIN_STALE });

export const useLegal = (slug: string) =>
  useQuery({ queryKey: ["legal", slug], queryFn: () => legalService.getDoc(slug) });

/* Phase 1.5 additions */
export const useCmsPage = (slug: string) =>
  useQuery({ queryKey: ["cms", "page", slug], queryFn: () => cmsService.getPage(slug) });
export const useCmsPages = () =>
  useQuery({ queryKey: ["cms", "pages"], queryFn: () => cmsService.listPages() });
export const useNavigation = () =>
  useQuery({ queryKey: ["navigation"], queryFn: () => navigationService.getNavigation() });

export const useCmsContentPages = () =>
  useQuery({ queryKey: ["cms", "content-pages"], queryFn: () => cmsContentService.listPages() });

export const useCmsContentPage = (route: string | null) =>
  useQuery({
    queryKey: ["cms", "content-page", route],
    queryFn: () => cmsContentService.getPage(route as string),
    enabled: Boolean(route),
  });

export const useFeatureFlags = () =>
  useQuery({ queryKey: ["features"], queryFn: () => featureService.list() });
export const useRoles = () =>
  useQuery({ queryKey: ["roles"], queryFn: () => permissionService.listRoles() });

export const useNotifications = () =>
  useQuery({ queryKey: ["notifications"], queryFn: () => notificationService.list() });

export const useSearchIndex = () =>
  useQuery({ queryKey: ["search", "index"], queryFn: () => searchService.index() });

export const useGlobalSettings = () =>
  useQuery({ queryKey: ["settings", "global"], queryFn: () => globalSettingsService.get() });

export const useDashboardWidgets = () =>
  useQuery({ queryKey: ["dashboard", "widgets"], queryFn: () => widgetService.list() });

export const useForms = () =>
  useQuery({ queryKey: ["forms"], queryFn: () => formService.list() });

/* Convenience hooks */
export { useFeatureFlagStore } from "@/store/featureFlagStore";
export { usePermissionStore } from "@/store/permissionStore";
export { useNotificationStore } from "@/store/notificationStore";
export { useModalStore, modal } from "@/store/modalStore";
export { useCommandStore } from "@/store/commandStore";

import { useFeatureFlagStore } from "@/store/featureFlagStore";
import { usePermissionStore } from "@/store/permissionStore";
import type {
  SubscriptionCreateManual,
  SubscriptionExtend,
  SubscriptionListParams,
  SubscriptionUpdate,
  UserListParams,
} from "@/types/admin";

export const useFeatureFlag = (key: string) =>
  useFeatureFlagStore((s) => s.isEnabled(key));

export const usePermission = (permission: string) =>
  usePermissionStore((s) => s.can(permission));