import { useQuery } from "@tanstack/react-query";
import { chatService } from "@/services/workspace.service";

/** Archived conversations of one Module + Tool workspace (kept out of the normal list). */
export const useArchivedThreads = (moduleId: string, toolId: string) =>
  useQuery({
    queryKey: ["chat", "threads", moduleId, toolId, "archived"],
    queryFn: () => chatService.listThreads(moduleId, toolId, true),
  });
