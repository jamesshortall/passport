import { SETUP_META } from "@/lib/constants";
import type { SetupEffort } from "@/lib/types";

export default function SetupEffortBadge({ effort }: { effort: SetupEffort }) {
  const meta = SETUP_META[effort];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
