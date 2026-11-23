import type { Tone } from "./components/ui";

export const peso = (n: number) =>
  "₱" +
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const day = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "—";

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  pending_return: "Pending return",
  returned: "Returned",
};

export const STATUS_TONE: Record<string, Tone> = {
  pending: "warning",
  approved: "success",
  pending_return: "purple",
  returned: "muted",
};
