import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../api";
import { useAuth } from "../../auth";
import Activity from "../../components/Activity";
import AvatarMenu from "../../components/AvatarMenu";
import { Badge, Notice, cardStyle } from "../../components/ui";
import { STATUS_LABEL, STATUS_TONE, day, peso } from "../../format";
import { colors } from "../../theme";

type Rental = {
  id: string;
  itemCode: string;
  itemName: string;
  status: string;
  borrowDate: string;
};
type Dash = {
  counts: {
    available: number;
    active: number;
    pending: number;
    returning: number;
    overdue: number;
  };
  penalty: { total: number; count: number };
  rules: { blockOnPenalty: boolean };
  recent: Rental[];
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await api<Dash>("/dashboard"));
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    setTick((t) => t + 1);
    await load();
    setRefreshing(false);
  }

  const cards: [string, number, string][] = data
    ? [
        ["Items available", data.counts.available, colors.text],
        ["Active rentals", data.counts.active, colors.success],
        ["Pending requests", data.counts.pending, colors.warning],
        ["Overdue rentals", data.counts.overdue, colors.danger],
      ]
    : [];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.blue}
          />
        }
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <View>
            <Text style={{ color: colors.muted }}>Hello,</Text>
            <Text
              style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}
            >
              {user?.name.split(" ")[0]}
            </Text>
          </View>
          <AvatarMenu />
        </View>

        {error ? (
          <Notice type="error" text={`${error} Pull down to try again.`} />
        ) : null}

        {data && data.penalty.count > 0 ? (
          <Notice
            type="error"
            text={`You have an unpaid penalty of ${peso(data.penalty.total)}.${data.rules.blockOnPenalty ? " You can't borrow new items until it's settled." : ""}`}
          />
        ) : null}

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {cards.map(([label, value, color]) => (
            <View key={label} style={[cardStyle, { width: "48%" }]}>
              <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
              <Text
                style={{ color, fontSize: 30, fontWeight: "700", marginTop: 2 }}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>

        <Activity refreshKey={tick} />

        {data ? (
          <View style={{ marginTop: 6 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 10,
              }}
            >
              Recent rentals
            </Text>
            {data.recent.length === 0 ? (
              <Text style={{ color: colors.muted }}>
                No rentals yet. Start borrowing!
              </Text>
            ) : (
              data.recent.map((r) => (
                <View
                  key={r.id}
                  style={[cardStyle, { padding: 14, marginBottom: 8 }]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={{ color: colors.text, fontWeight: "600" }}>
                        {r.itemName}
                      </Text>
                      <Text
                        style={{
                          color: colors.muted,
                          marginTop: 2,
                          fontSize: 13,
                        }}
                      >
                        {r.itemCode} · {day(r.borrowDate)}
                      </Text>
                    </View>
                    <Badge
                      label={STATUS_LABEL[r.status] ?? r.status}
                      tone={STATUS_TONE[r.status] ?? "muted"}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
