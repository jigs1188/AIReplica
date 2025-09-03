import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

const features = [
  { title: "Your Clone", subtitle: "Chat, auto-reply, and draft in your voice", icon: "robot-outline", route: "/clone" },
  { title: "Meeting Memory", subtitle: "Summaries & action items from meetings", icon: "calendar-check", route: "/MeetingMemory" },
  { title: "Training Center", subtitle: "Teach your clone with examples", icon: "brain", route: "/training" },
  { title: "Conversation History", subtitle: "Review past replies & edits", icon: "history", route: "/history" },
  { title: "Prompt Templates", subtitle: "Save common requests & shortcuts", icon: "flash", route: "/prompts" },
  { title: "Integrations & Settings", subtitle: "Connect Gmail, WhatsApp, Teams, etc.", icon: "cog-outline", route: "/settings" },
];

const FeatureCard = ({ title, subtitle, iconName, onPress, color = "#6A0572" }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      backgroundColor: "#fff",
      borderRadius: 18,
      padding: 18,
      marginBottom: 14,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#6A0572",
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 2,
    }}
    activeOpacity={0.88}
  >
    <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: `${color}22`, justifyContent: "center", alignItems: "center" }}>
      <MaterialCommunityIcons name={iconName} size={26} color={color} />
    </View>
    <View style={{ marginLeft: 16, flex: 1 }}>
      <Text style={{ fontSize: 17, fontWeight: "600", color: "#222" }}>{title}</Text>
      <Text style={{ fontSize: 13, color: "#6A0572", marginTop: 2 }}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
  </TouchableOpacity>
);

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F2FB" }}>
      {/* Top navbar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image source={require("../../assets/images/logo.jpg")} style={{ width: 38, height: 38, borderRadius: 8 }} />
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#6A0572", marginLeft: 10 }}>AIReplica</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity style={{ padding: 6, marginRight: 8 }}>
            <Ionicons name="notifications-outline" size={22} color="#6A0572" />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 6 }} onPress={() => router.push("/settings")}>
            <Ionicons name="settings-outline" size={24} color="#6A0572" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18 }}>
        {/* Hero / Clone CTA */}
        <View style={{ backgroundColor: "#6A0572", borderRadius: 18, padding: 22, marginBottom: 18 }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 6 }}>Start with Your Clone</Text>
          <Text style={{ color: "#E1BEE7", fontSize: 15, marginBottom: 16 }}>Draft replies, get suggestions, or let your clone handle routine messages.</Text>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={() => router.push("/clone")}
              style={{ backgroundColor: "#fff", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24, marginRight: 10 }}
              activeOpacity={0.9}
            >
              <Text style={{ color: "#6A0572", fontWeight: "700", fontSize: 16 }}>Open Clone</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/training")}
              style={{ backgroundColor: "#fff", opacity: 0.2, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24 }}
              activeOpacity={0.9}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Train Clone</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feature list */}
        {features.map((f) => (
          <FeatureCard
            key={f.title}
            title={f.title}
            subtitle={f.subtitle}
            iconName={f.icon}
            onPress={() => router.push(f.route)}
            color="#6A0572"
          />
        ))}

        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 13, color: "#999", textAlign: "center" }}>
            Tip: Add 5+ sample replies in Training for a strong clone voice.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
