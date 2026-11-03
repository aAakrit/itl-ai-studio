/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/layouts/PublicLayout";
import { BridgeLanding } from "@/features/bridge/BridgeLanding";

export const Route = createFileRoute("/bridge")({
  component: BridgePage,
  head: () => ({
    meta: [
      { title: "ITL Bridge AI — Your Tax Knowledge. Your AI." },
      {
        name: "description",
        content:
          "Connect Income Tax Library with ChatGPT, Claude, Gemini and other compatible AI assistants through ITL Bridge AI.",
      },
      { property: "og:title", content: "ITL Bridge AI — Your Tax Knowledge. Your AI." },
      {
        property: "og:description",
        content: "Bring trusted Indian Income Tax and GST research into the AI you already use.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

function BridgePage() {
  return (
    <PublicLayout>
      <BridgeLanding />
    </PublicLayout>
  );
}
