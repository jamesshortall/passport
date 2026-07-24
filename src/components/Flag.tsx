import { isoFromFlagEmoji } from "@/lib/flags";

/**
 * Renders a real flag image (via flag-icons) instead of a flag emoji, since
 * Windows browsers render flag emoji as bare country-code letters ("CN").
 * Accepts either a flag emoji or an ISO alpha-2 code.
 */
export default function Flag({
  emoji,
  code,
  className = "",
  rounded = true,
  size = "1.5rem",
}: {
  emoji?: string | null;
  code?: string | null;
  className?: string;
  rounded?: boolean;
  size?: string;
}) {
  const iso = (code || isoFromFlagEmoji(emoji) || "").toLowerCase();

  if (!iso) {
    return (
      <span className={className} aria-hidden style={{ fontSize: size }}>
        🏳️
      </span>
    );
  }

  return (
    <span
      className={`fi fi-${iso} fis ${rounded ? "rounded-full" : "rounded-sm"} shrink-0 shadow-sm ring-1 ring-black/5 ${className}`}
      style={{ width: size, height: size, backgroundSize: "cover" }}
      role="img"
      aria-label={`${iso.toUpperCase()} flag`}
    />
  );
}
