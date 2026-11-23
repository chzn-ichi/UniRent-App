import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../api";
import { Badge, Chip, Notice, cardStyle } from "../../components/ui";
import { STATUS_LABEL, STATUS_TONE, day, peso } from "../../format";
import { colors } from "../../theme";

type Rental = {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  status: string;
  borrowDate: string;
  dueDate: string | null;
  overdue: boolean;
  lateFee: number;
};

const TABS: [string, string][] = [
  ["all", "All"],
  ["pending", "Pending"],
  ["active", "Active"],
  ["returning", "Pending return"],
  ["overdue", "Overdue"],
];

export default function Rentals() {
  const [tab, setTab] = useState("all");
  const [rentals, setRentals] = useState<Rental[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(t);
  }, [notice]);

  const load = useCallback(async () => {
    try {
      const res = await api<{ rentals: Rental[] }>("/rentals?tab=" + tab);
      setRentals(res.rentals);
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }, [tab]);

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

  async function act(
    id: string,
    action: "return" | "cancel",
    okMessage: string,
  ) {
    setBusyId(id);
    try {
      await api(`/rentals/${id}/${action}`, { method: "POST" });
      setNotice(okMessage);
      setError("");
    } catch (e: any) {
      setError(e.message);
      setNotice("");
    } finally {
      setBusyId(null);
      load();
    }
  }

  function confirmReturn(r: Rental) {
    Alert.alert(
      "Request return",
      "The admin will check the item's condition. Only request a return once you're ready to hand it over.",
      [
        { text: "Not yet", style: "cancel" },
        {
          text: "Request return",
          onPress: () =>
            act(
              r.id,
              "return",
              "Return request submitted. The admin will verify the item condition.",
            ),
        },
      ],
    );
  }

  function confirmCancel(r: Rental) {
    Alert.alert(
      "Cancel request",
      `Cancel your request for ${r.itemName} (${r.itemCode})? The item will be available for others again.`,
      [
        { text: "Keep request", style: "cancel" },
        {
          text: "Cancel request",
          style: "destructive",
          onPress: () =>
            act(
              r.id,
              "cancel",
              "Request cancelled. The item is available again.",
            ),
        },
      ],
    );
  }

  const header = (
    <View>
      <Text
        style={{
          color: colors.text,
          fontSize: 26,
          fontWeight: "700",
          marginBottom: 14,
        }}
      >
        My rentals
      </Text>
      {notice ? <Notice type="success" text={notice} /> : null}
      {error ? <Notice type="error" text={error} /> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 14 }}
      >
        {TABS.map(([key, label]) => (
          <Chip
            key={key}
            label={label}
            active={tab === key}
            onPress={() => setTab(key)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top"]}
    >
      <FlatList
        data={rentals ?? []}
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
            style={{ color: colors.muted, textAlign: "center", marginTop: 30 }}
          >
            {rentals ? "Nothing here yet." : error ? "" : "Loading..."}
          </Text>
        }
        renderItem={({ item: r }) => (
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
                  {r.itemCode} · {r.category}
                </Text>
              </View>
              <Badge
                label={STATUS_LABEL[r.status] ?? r.status}
                tone={STATUS_TONE[r.status] ?? "muted"}
              />
            </View>

            <Text style={{ color: colors.muted, marginTop: 10, fontSize: 13 }}>
              Borrowed {day(r.borrowDate)} · Due {day(r.dueDate)}
            </Text>

            {r.overdue ? (
              <Text
                style={{
                  color: colors.danger,
                  marginTop: 6,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                Overdue
                {r.lateFee > 0 ? ` · late fee so far ${peso(r.lateFee)}` : ""}
              </Text>
            ) : null}

            {r.status === "approved" ? (
              <Pressable
                onPress={() => confirmReturn(r)}
                disabled={busyId === r.id}
                style={{
                  marginTop: 14,
                  height: 42,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(245,158,11,0.16)",
                  borderColor: "rgba(245,158,11,0.40)",
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: colors.warning, fontWeight: "600" }}>
                  {busyId === r.id ? "Sending..." : "Request return"}
                </Text>
              </Pressable>
            ) : null}

            {r.status === "pending" ? (
              <Pressable
                onPress={() => confirmCancel(r)}
                disabled={busyId === r.id}
                style={{
                  marginTop: 14,
                  height: 42,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  borderColor: "rgba(239,68,68,0.40)",
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: colors.danger, fontWeight: "600" }}>
                  {busyId === r.id ? "Cancelling..." : "Cancel request"}
                </Text>
              </Pressable>
            ) : null}

            {r.status === "pending_return" ? (
              <Text
                style={{ color: colors.muted, marginTop: 12, fontSize: 13 }}
              >
                Waiting for the admin to check the item.
              </Text>
            ) : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}
