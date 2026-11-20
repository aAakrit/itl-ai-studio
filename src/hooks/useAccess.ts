import { useQuery } from "@tanstack/react-query";
import { accessService } from "@/services/access.service";
import { useToken } from "@/hooks/useAuth";

/** What the signed-in user may use: the ITL AI workspace and/or ITL Bridge AI. */
export const useMyAccess = () => {
  const token = useToken();
  return useQuery({
    queryKey: ["access", "me", token],
    queryFn: () => accessService.me(),
    enabled: Boolean(token),
    staleTime: 60_000,
    retry: false,
  });
};
