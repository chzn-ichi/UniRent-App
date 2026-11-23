import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../api";
import { Badge, Chip, Notice, cardStyle } from "../../components/ui";
import { peso } from "../../format";
import { colors } from "../../theme";

type Item = {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
};
type Data = {
  items: Item[];
  categories: string[];
  inProgress: number;
  maxRentals: number;
  blocked: boolean;
  penalty: { total: number; count: number };
};

export default function Borrow() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const latest = useRef(0);

  // Wait a moment after typing before asking the server
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Success messages fade on their own
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(t);
  }, [notice]);

  const load = useCallback(async () => {
    const id = ++latest.current;
    const parts: string[] = [];
    if (category) parts.push("category=" + encodeURIComponent(category));
    if (debounced) parts.push("q=" + encodeURIComponent(debounced));
    try {
      const res = await api<Data>(
        "/items" + (parts.length ? "?" + parts.join("&") : ""),
      );
      if (id !== latest.current) return; // an older answer arrived late
      setData(res);
      setError("");
    } catch (e: any) {
      if (id === latest.current) setError(e.message);
    }
  }, [category, debounced]);

  // Loads when the tab is opened, and again when the search or category changes
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

  async function borrow(item: Item) {
    setBusyId(item.id);
    try {
      await api("/borrow", { body: { itemId: item.id } });
      setNotice("Borrow request submitted. Wait for admin approval.");
      setError("");
    } catch (e: any) {
      setError(e.message);
      setNotice("");
    } finally {
      setBusyId(null);
      load();
    }
  }

  function confirmBorrow(item: Item) {
    Alert.alert(
      "Borrow this item",
      `Request to borrow ${item.itemName} (${item.itemCode})? It counts toward your limit of ${data?.maxRentals} rentals until it's returned, and the admin must approve it first.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Request to borrow", onPress: () => borrow(item) },
      ],
    );
  }

  const atLimit = data ? data.inProgress >= data.maxRentals : false;
  const blocked = data?.blocked ?? false;

  const header = (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: "700" }}>
            Borrow an item
          </Text>
          <Text style={{ color: colors.muted, marginTop: 2 }}>
            Pick something available and send a request.
          </Text>
        </View>
        {data ? (
          <View
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.line,
              borderWidth: 1,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}
            >
              {data.inProgress} of {data.maxRentals} in use
            </Text>
          </View>
        ) : null}
      </View>

      {notice ? <Notice type="success" text={notice} /> : null}
      {error ? <Notice type="error" text={error} /> : null}
      {blocked && data ? (
        <Notice
          type="error"
          text={`You have an unpaid penalty of ${peso(data.penalty.total)}. Settle it with the rental officer to borrow again.`}
        />
      ) : atLimit && data ? (
        <Notice
          type="warning"
          text={`You already have ${data.inProgress} rental(s) in progress. The maximum is ${data.maxRentals}.`}
        />
      ) : null}

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search by name or code"
        placeholderTextColor="rgba(214,226,244,0.40)"
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          height: 46,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.panel,
          color: colors.text,
          paddingHorizontal: 18,
          fontSize: 15,
          marginBottom: 12,
        }}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ marginBottom: 14 }}
      >
        <Chip
          label="All"
          active={category === null}
          onPress={() => setCategory(null)}
        />
        {(data?.categories ?? []).map((c) => (
          <Chip
            key={c}
            label={c}
            active={category === c}
            onPress={() => setCategory(c)}
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
        data={data?.items ?? []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
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
            {data ? "No available items match." : error ? "" : "Loading..."}
          </Text>
        }
        renderItem={({ item }) => {
          const disabled = blocked || atLimit || busyId === item.id;
          const label = blocked
            ? "Unpaid penalty"
            : atLimit
              ? "Limit reached"
              : busyId === item.id
                ? "Sending..."
                : "Borrow";
          return (
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
                    {item.itemName}
                  </Text>
                  <Text
                    style={{ color: colors.muted, marginTop: 2, fontSize: 13 }}
                  >
                    {item.itemCode}
                  </Text>
                </View>
                <Badge label={item.category} tone="info" />
              </View>
              <Pressable
                onPress={() => confirmBorrow(item)}
                disabled={disabled}
                style={{
                  marginTop: 14,
                  height: 42,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: disabled
                    ? "rgba(255,255,255,0.08)"
                    : colors.blue,
                }}
              >
                <Text
                  style={{
                    color: disabled ? colors.muted : "#fff",
                    fontWeight: "600",
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
