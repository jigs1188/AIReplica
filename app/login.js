import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "expo-router";
import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useThemeColor } from "../hooks/useThemeColor";

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "icon");
  const destructiveColor = useThemeColor({}, "destructive");
  const tintColor = useThemeColor({}, "tint");

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigation.navigate("dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={{ flex: 1 }}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>
            {isLogin ? "Login" : "Sign Up"}
          </ThemedText>

          <TextInput
            style={[styles.input, { borderColor: borderColor, color: textColor }]}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            placeholderTextColor={borderColor}
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, { borderColor: borderColor, color: textColor }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor={borderColor}
          />

          {error ? <Text style={[styles.error, { color: destructiveColor }]}>{error}</Text> : null}

          <TouchableOpacity
            style={{
              backgroundColor: "#6A0572",
              paddingHorizontal: 38,
              paddingVertical: 16,
              borderRadius: 28,
              marginBottom: 18,
              shadowColor: "#6A0572",
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 2,
            }}
            onPress={handleAuth}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>{isLogin ? "Login" : "Sign Up"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("OnboardingScreen")}>
            <Text style={{ color: "#fff", fontSize: 16, textDecorationLine: "underline" }}>
              {isLogin ? "Need an account? Sign Up" : "Have an account? Login"}
            </Text>
          </TouchableOpacity>
        </ThemedView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 18,
  },
  input: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    marginBottom: 18,
    color: "#6A0572",
  },
  error: {
    textAlign: "center",
    marginBottom: 16,
  },
  switchText: {
    textAlign: "center",
    marginTop: 16,
  },
});