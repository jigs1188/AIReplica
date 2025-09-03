import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "expo-router";

export default function SplashScreen() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#6A0572", "#AB47BC", "#E1BEE7"]}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          {/* Logo Section */}
          <Image
            source={require("../assets/images/logo.jpg")}
            style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 18 }}
          />
          <Text style={{ color: "#fff", fontSize: 44, fontWeight: "bold", marginBottom: 10, letterSpacing: 1 }}>AIReplica</Text>
          <Text style={{ color: "#fff", fontSize: 18, opacity: 0.9, textAlign: "center", marginBottom: 32 }}>
            Your Personal Digital Clone for Routine Tasks
          </Text>

          {/* Navigation Buttons */}
          <TouchableOpacity
            style={{ backgroundColor: "#fff", paddingHorizontal: 38, paddingVertical: 16, borderRadius: 28, marginBottom: 18, shadowColor: "#6A0572", shadowOpacity: 0.15, shadowRadius: 8, elevation: 2 }}
            onPress={() => navigation.navigate("OnboardingScreen")}
          >
            <Text style={{ color: "#6A0572", fontSize: 18, fontWeight: "bold" }}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ borderWidth: 2, borderColor: "#fff", paddingHorizontal: 38, paddingVertical: 16, borderRadius: 28 }}
            onPress={() => navigation.navigate("login")}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Login</Text>
          </TouchableOpacity>
        </View>
        <View style={{ position: "absolute", bottom: 18, width: "100%", alignItems: "center" }}>
          <Text style={{ color: "#fff", fontSize: 13, opacity: 0.7 }}>
            Powered by AIReplica © {new Date().getFullYear()}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
