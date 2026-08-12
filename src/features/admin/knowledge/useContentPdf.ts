/* eslint-disable prettier/prettier */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { api, endpoints } from "@/services/api/api";

/**
 * Fetches the stored PDF through the authenticated API layer and exposes it as
 * a blob URL so it can be embedded (never downloaded). The URL is revoked when
 * the component unmounts or the content changes.
 */
export function useContentPdf(contentId?: string, enabled = true) {
  const query = useQuery({
    queryKey: ["book-content-pdf", contentId],
    queryFn: async () => {
      const { data } = await api.get<Blob>(endpoints.books.contentPdf(contentId!), {
        responseType: "blob",
      });
      return data;
    },
    enabled: enabled && Boolean(contentId),
    retry: false,
    staleTime: 5 * 60_000,
    gcTime: 5 * 60_000,
  });

  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data || typeof window === "undefined") {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(query.data);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [query.data]);

  return {
    objectUrl,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    /** Undefined while unresolved, then true/false once the request settles. */
    hasPdf: query.isSuccess ? true : query.isError ? false : undefined,
  };
}
