import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { api } from "../api";
import { colors } from "../theme";
import { cardStyle } from "./ui";

type Stats = {
  months: { label: string; count: number }[];
  top: { name: string; count: number }[];
  returned: number;
  onTime: number;
};

export default function Activity({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    api<Stats>("/my-stats")
      .then((s) => {
        if (alive) {
          setStats(s);
          setFailed(false);
        }
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  if (failed && !stats) return null;

  if (!stats) {
    return <View style={[cardStyle, { height: 190, opacity: 0.5 }]} />;
  }

  const max = Math.max(1, ...stats.months.map((m) => m.count));
  const rate = stats.returned
    ? Math.round((stats.onTime / stats.returned) * 100) + "%"
    : "—";

  return (
    <View>
      <Text
        style={{
          color: colors.text,
          fontSize: 18,
          fontWeight: "600",
          marginBottom: 10,
        }}
      >
        My activity
      </Text>

      <View style={cardStyle}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          Requests per month
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            height: 120,
            marginTop: 12,
          }}
        >
          {stats.months.map((m) => (
            <View
              key={m.label}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <Text
                style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}
              >
                {m.count}
              </Text>
              <View
                style={{
                  width: 22,
                  height: Math.max(m.count > 0 ? 6 : 2, (m.count / max) * 80),
                  borderRadius: 6,
                  backgroundColor:
                    m.count > 0 ? colors.blue : "rgba(255,255,255,0.10)",
                }}
              />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", marginTop: 6 }}>
          {stats.months.map((m) => (
            <Text
              key={m.label}
              style={{
                flex: 1,
                textAlign: "center",
                color: colors.muted,
                fontSize: 11,
              }}
            >
              {m.label}
            </Text>
          ))}
        </View>
      </View>

      <View style={cardStyle}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          On-time returns
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: 30,
            fontWeight: "700",
            marginTop: 2,
          }}
        >
          {rate}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          Returned on or before the due date
        </Text>
      </View>

      <View style={cardStyle}>
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 10 }}>
          Items you borrow most
        </Text>
        {stats.top.length === 0 ? (
          <Text style={{ color: colors.muted }}>Nothing borrowed yet.</Text>
        ) : (
          stats.top.map((t) => (
            <View key={t.name} style={{ marginBottom: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "500" }}>
                  {t.name}
                </Text>
                <Text style={{ color: colors.muted }}>{t.count}x</Text>
              </View>
              <View
                style={{
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  marginTop: 6,
                }}
              >
                <View
                  style={{
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: colors.blue,
                    width: `${Math.round((t.count / stats.top[0].count) * 100)}%`,
                  }}
                />
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
