import { api } from "@/services/api/api";

export interface MyAccess {
  /** May use the ITL AI workspace (admin, staff, or an active plan that includes ITL AI). */
  workspace: boolean;
  /** Has an active plan that includes ITL Bridge AI. */
  bridge: boolean;
  is_admin: boolean;
  is_staff: boolean;
}

export const accessService = {
  async me(): Promise<MyAccess> {
    const { data } = await api.get("/access/me");
    return data;
  },
};
