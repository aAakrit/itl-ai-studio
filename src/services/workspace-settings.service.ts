import { api, endpoints } from "@/services/api/api";
import type {
  EffectiveWorkspaceSettings,
  UserPreferencesUpdate,
  WorkspaceSettings,
  WorkspaceSettingsUpdate,
} from "@/types/admin";

export const workspaceSettingsService = {
  async getAdmin(): Promise<WorkspaceSettings> {
    const { data } = await api.get(endpoints.adminWorkspaceSettings.get);
    return data;
  },
  async updateAdmin(patch: WorkspaceSettingsUpdate): Promise<WorkspaceSettings> {
    const { data } = await api.put(endpoints.adminWorkspaceSettings.get, patch);
    return data;
  },
  async getMine(): Promise<EffectiveWorkspaceSettings> {
    const { data } = await api.get(endpoints.workspaceSettings.get);
    return data;
  },
  async updateMine(patch: UserPreferencesUpdate): Promise<EffectiveWorkspaceSettings> {
    const { data } = await api.put(endpoints.workspaceSettings.get, patch);
    return data;
  },
};
