import { Pressable, Text, View } from "react-native";
import { colors } from "../theme";

const tones = {
  success: { bg: "rgba(16,185,129,0.16)", fg: "#6EE7B7" },
  warning: { bg: "rgba(245,158,11,0.16)", fg: "#FCD34D" },
  danger: { bg: "rgba(239,68,68,0.16)", fg: "#FCA5A5" },
  info: { bg: "rgba(59,130,246,0.20)", fg: "#93C5FD" },
  purple: { bg: "rgba(139,92,246,0.20)", fg: "#C4B5FD" },
  muted: { bg: "rgba(255,255,255,0.10)", fg: "rgba(214,226,244,0.70)" },
} as const;

export type Tone = keyof typeof tones;

export const cardStyle = {
  backgroundColor: colors.panel,
  borderColor: colors.line,
  borderWidth: 1,
  borderRadius: 18,
  padding: 16,
  marginBottom: 12,
} as const;

export function Badge({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: Tone;
}) {
  const t = tones[tone];
  return (
    <View
      style={{
        backgroundColor: t.bg,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 3,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: t.fg, fontSize: 12, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}

export function Notice({
  type,
  text,
}: {
  type: "success" | "error" | "warning";
  text: string;
}) {
  const tone =
    type === "error"
      ? tones.danger
      : type === "warning"
        ? tones.warning
        : tones.success;
  return (
    <View
      style={{
        backgroundColor: tone.bg,
        borderColor: tone.fg + "55",
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <Text style={{ color: tone.fg }}>{text}</Text>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        marginRight: 8,
        borderWidth: 1,
        borderColor: active ? "transparent" : colors.line,
        backgroundColor: active ? colors.blue : colors.panel,
      }}
    >
      <Text
        style={{
          color: active ? "#fff" : colors.muted,
          fontWeight: "600",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
