import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../auth";
import { colors } from "../theme";

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

export default function AvatarMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const openProfile = () => {
    setOpen(false);
    router.push("/profile");
  };
  const signOut = () => {
    setOpen(false);
    logout();
  };

  const row = {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  } as const;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityLabel="Account menu"
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.blue,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {initials(user.name)}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(3,10,24,0.45)" }}
          onPress={() => setOpen(false)}
        >
          <View
            style={{
              position: "absolute",
              top: insets.top + 68,
              right: 20,
              width: 260,
              backgroundColor: "#0E2140",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.line,
              padding: 8,
            }}
          >
            <View style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
              <Text
                style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}
                numberOfLines={1}
              >
                {user.name}
              </Text>
              <Text
                style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}
                numberOfLines={1}
              >
                {user.email}
              </Text>
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: colors.line,
                marginVertical: 4,
              }}
            />

            <Pressable onPress={openProfile} style={row}>
              <Ionicons name="person-outline" size={20} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: "500" }}>
                Profile & settings
              </Text>
            </Pressable>
            <Pressable onPress={signOut} style={row}>
              <Ionicons
                name="log-out-outline"
                size={20}
                color={colors.danger}
              />
              <Text style={{ color: colors.danger, fontWeight: "500" }}>
                Log out
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
