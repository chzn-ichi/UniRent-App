import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth";
import { colors } from "../theme";

import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../config";

const input = {
  height: 48,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: colors.line,
  backgroundColor: colors.panel,
  color: colors.text,
  paddingHorizontal: 14,
  fontSize: 16,
} as const;

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [show, setShow] = useState(false);

  async function submit() {
    if (busy) return;
    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={{ width: 84, height: 84, borderRadius: 20 }}
            />
            <Text
              style={{
                color: colors.text,
                fontSize: 28,
                fontWeight: "700",
                marginTop: 14,
              }}
            >
              UniRent
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              Borrow what you need.
            </Text>
          </View>

          {error ? (
            <View
              style={{
                backgroundColor: "rgba(239,68,68,0.16)",
                borderColor: "rgba(239,68,68,0.40)",
                borderWidth: 1,
                borderRadius: 14,
                padding: 12,
                marginBottom: 14,
              }}
            >
              <Text style={{ color: colors.danger }}>{error}</Text>
            </View>
          ) : null}

          <Text style={{ color: colors.muted, marginBottom: 6 }}>
            Email address
          </Text>
          <TextInput
            style={input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor="rgba(214,226,244,0.40)"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <Text style={{ color: colors.muted, marginTop: 14, marginBottom: 6 }}>
            Password
          </Text>
          <View style={{ justifyContent: "center" }}>
            <TextInput
              style={[input, { paddingRight: 48 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="rgba(214,226,244,0.40)"
              secureTextEntry={!show}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={submit}
            />
            <Pressable
              onPress={() => setShow((s) => !s)}
              hitSlop={10}
              accessibilityLabel={show ? "Hide password" : "Show password"}
              style={{ position: "absolute", right: 14 }}
            >
              <Ionicons
                name={show ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={colors.muted}
              />
            </Pressable>
          </View>

          <Pressable
            onPress={() => Linking.openURL(`${API_URL}/forgot-password`)}
            style={{ alignSelf: "flex-end", marginTop: 10, paddingVertical: 4 }}
          >
            <Text style={{ color: "#93C5FD", fontWeight: "600" }}>
              Forgot password?
            </Text>
          </Pressable>

          <Pressable
            onPress={submit}
            disabled={busy}
            style={{
              height: 50,
              borderRadius: 14,
              backgroundColor: colors.blue,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 22,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Login
              </Text>
            )}
          </Pressable>

          <Text
            style={{
              color: colors.muted,
              textAlign: "center",
              marginTop: 20,
              fontSize: 13,
            }}
          >
            No account yet? Create one on the UniRent website first.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
