import type { ComponentProps } from "react";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api";
import { useAuth } from "../auth";
import { Notice, cardStyle } from "../components/ui";
import { colors } from "../theme";

type Msg = { type: "success" | "error"; text: string } | null;
type PublicUser = {
  id: string;
  name: string;
  email: string;
  notifyEmail?: boolean;
};

const inputStyle = {
  height: 48,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: colors.line,
  backgroundColor: "rgba(255,255,255,0.06)",
  color: colors.text,
  paddingHorizontal: 14,
  fontSize: 16,
} as const;

function Field({
  label,
  ...props
}: { label: string } & ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: colors.muted, marginBottom: 6 }}>{label}</Text>
      <TextInput
        {...props}
        style={inputStyle}
        placeholderTextColor="rgba(214,226,244,0.40)"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

function Button({
  label,
  onPress,
  busy,
  danger,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={{
        height: 46,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 4,
        opacity: busy ? 0.7 : 1,
        backgroundColor: danger ? "transparent" : colors.blue,
        borderWidth: danger ? 1 : 0,
        borderColor: "rgba(239,68,68,0.40)",
      }}
    >
      {busy ? (
        <ActivityIndicator color={danger ? colors.danger : "#fff"} />
      ) : (
        <Text
          style={{ color: danger ? colors.danger : "#fff", fontWeight: "600" }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [busy, setBusy] = useState<
    "name" | "password" | "delete" | "notify" | null
  >(null);

  const [name, setName] = useState(user?.name ?? "");
  const [nameMsg, setNameMsg] = useState<Msg>(null);
  const [notifyMsg, setNotifyMsg] = useState<Msg>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState<Msg>(null);

  const [delPw, setDelPw] = useState("");
  const [delMsg, setDelMsg] = useState<Msg>(null);

  const notify = user?.notifyEmail !== false;

  async function saveName() {
    setNameMsg(null);
    setBusy("name");
    try {
      const res = await api<{ user: PublicUser }>("/profile/name", {
        body: { name },
      });
      setUser(res.user);
      setName(res.user.name);
      setNameMsg({ type: "success", text: "Name updated." });
    } catch (e: any) {
      setNameMsg({ type: "error", text: e.message });
    } finally {
      setBusy(null);
    }
  }

  async function toggleNotify(value: boolean) {
    if (!user) return;
    setNotifyMsg(null);
    setBusy("notify");
    try {
      const res = await api<{ notifyEmail: boolean }>(
        "/profile/notifications",
        { body: { notifyEmail: value } },
      );
      setUser({ ...user, notifyEmail: res.notifyEmail });
      setNotifyMsg({
        type: "success",
        text: res.notifyEmail
          ? "Email notifications are on."
          : "Email notifications are off.",
      });
    } catch (e: any) {
      setNotifyMsg({ type: "error", text: e.message });
    } finally {
      setBusy(null);
    }
  }

  async function savePassword() {
    setPwMsg(null);
    if (next.length < 6)
      return setPwMsg({
        type: "error",
        text: "The new password must be at least 6 characters.",
      });
    if (next !== confirm)
      return setPwMsg({
        type: "error",
        text: "The new passwords do not match.",
      });

    setBusy("password");
    try {
      await api("/profile/password", {
        body: { currentPassword: current, newPassword: next },
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      setPwMsg({ type: "success", text: "Password updated." });
    } catch (e: any) {
      setPwMsg({ type: "error", text: e.message });
    } finally {
      setBusy(null);
    }
  }

  function confirmDelete() {
    setDelMsg(null);
    if (!delPw)
      return setDelMsg({
        type: "error",
        text: "Enter your password to confirm.",
      });

    Alert.alert(
      "Delete your account",
      "Your account will be permanently deleted. Your past rentals stay in the records, but they will no longer show your name.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            setBusy("delete");
            try {
              await api("/profile/delete", { body: { password: delPw } });
              await logout();
            } catch (e: any) {
              setDelMsg({ type: "error", text: e.message });
              setBusy(null);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={cardStyle}>
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              Account details
            </Text>
            {nameMsg ? (
              <Notice type={nameMsg.type} text={nameMsg.text} />
            ) : null}
            <Field
              label="Full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              maxLength={60}
            />
            <Text style={{ color: colors.muted, marginBottom: 6 }}>
              Email address
            </Text>
            <Text style={{ color: colors.text, marginBottom: 14 }}>
              {user?.email}
            </Text>
            <Button
              label="Save name"
              onPress={saveName}
              busy={busy === "name"}
            />
          </View>

          <View style={cardStyle}>
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              Settings
            </Text>
            {notifyMsg ? (
              <Notice type={notifyMsg.type} text={notifyMsg.text} />
            ) : null}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  Email notifications
                </Text>
                <Text
                  style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}
                >
                  Approvals, returns, penalties, and due-date reminders.
                  Security codes are always sent.
                </Text>
              </View>
              <Switch
                value={notify}
                onValueChange={toggleNotify}
                disabled={busy === "notify"}
                trackColor={{
                  false: "rgba(255,255,255,0.2)",
                  true: colors.blue,
                }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={cardStyle}>
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              Change password
            </Text>
            {pwMsg ? <Notice type={pwMsg.type} text={pwMsg.text} /> : null}
            <Field
              label="Current password"
              value={current}
              onChangeText={setCurrent}
              secureTextEntry
            />
            <Field
              label="New password"
              value={next}
              onChangeText={setNext}
              secureTextEntry
              placeholder="Minimum 6 characters"
            />
            <Field
              label="Confirm new password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />
            <Button
              label="Update password"
              onPress={savePassword}
              busy={busy === "password"}
            />
          </View>

          <Pressable
            onPress={logout}
            style={{
              height: 48,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.panel,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              Log out
            </Text>
          </Pressable>

          <View style={[cardStyle, { borderColor: "rgba(239,68,68,0.40)" }]}>
            <Text
              style={{
                color: colors.danger,
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 6,
              }}
            >
              Delete account
            </Text>
            <Text
              style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}
            >
              You can only delete your account when you have no rentals in
              progress and no unpaid penalties.
            </Text>
            {delMsg ? <Notice type={delMsg.type} text={delMsg.text} /> : null}
            <Field
              label="Password"
              value={delPw}
              onChangeText={setDelPw}
              secureTextEntry
            />
            <Button
              label="Delete my account"
              onPress={confirmDelete}
              busy={busy === "delete"}
              danger
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
