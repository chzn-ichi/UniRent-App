import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../api";
import { Badge, Notice, cardStyle } from "../../components/ui";
import { day, peso } from "../../format";
import { colors } from "../../theme";

type PenaltyRental = {
  id: string;
  itemCode: string;
  itemName: string;
  returnDate: string | null;
  penalty?: { amount: number; reason: string; paid: boolean; waived: boolean };
};
type Data = {
  penalty: { total: number; count: number };
  rules: { blockOnPenalty: boolean };
  rentals: PenaltyRental[];
};

export default function Penalties() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api<Data>("/penalties"));
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const owing = !!data && data.penalty.count > 0;

  const header = (
    <View>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: "700" }}>
        My penalties
      </Text>
      <Text style={{ color: colors.muted, marginTop: 2, marginBottom: 14 }}>
        Penalties are paid in person to the rental officer.
      </Text>
      {error ? <Notice type="error" text={error} /> : null}

      {data ? (
        <View
          style={[
            cardStyle,
            owing
              ? {
                  backgroundColor: "rgba(239,68,68,0.16)",
                  borderColor: "rgba(239,68,68,0.40)",
                }
              : null,
          ]}
        >
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            Unpaid balance
          </Text>
          <Text
            style={{
              color: owing ? colors.danger : colors.text,
              fontSize: 30,
              fontWeight: "700",
              marginTop: 2,
            }}
          >
            {peso(data.penalty.total)}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6, fontSize: 13 }}>
            {owing
              ? `Pay the rental officer in person, and they will mark it as paid.${data.rules.blockOnPenalty ? " Borrowing is paused until then." : ""}`
              : "All settled. You have no unpaid penalties."}
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top"]}
    >
      <FlatList
        data={data?.rentals ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.blue}
          />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={
          <Text
            style={{ color: colors.muted, textAlign: "center", marginTop: 20 }}
          >
            {data ? "No penalties on record." : error ? "" : "Loading..."}
          </Text>
        }
        renderItem={({ item: r }) =>
          r.penalty ? (
            <View style={cardStyle}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    {r.itemName}
                  </Text>
                  <Text
                    style={{ color: colors.muted, marginTop: 2, fontSize: 13 }}
                  >
                    {r.itemCode}
                  </Text>
                </View>
                {r.penalty.waived ? (
                  <Badge label="Waived" tone="muted" />
                ) : r.penalty.paid ? (
                  <Badge label="Paid" tone="success" />
                ) : (
                  <Badge label="Unpaid" tone="danger" />
                )}
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "700",
                  marginTop: 10,
                }}
              >
                {peso(r.penalty.amount)}
              </Text>
              <Text style={{ color: colors.muted, marginTop: 4, fontSize: 13 }}>
                {r.penalty.reason} · Returned {day(r.returnDate)}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
