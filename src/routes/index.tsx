import { createFileRoute } from "@tanstack/react-router";
import ZoneRushApp from "@/components/zonerush/FullApp";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ZoneRush — Campus Gamification" },
      { name: "description", content: "ZoneRush: The ultimate campus gamification platform with missions, clans, zones, and rewards." },
    ],
  }),
});

function Index() {
  return <ZoneRushApp />;
}
