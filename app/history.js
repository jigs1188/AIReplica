import React, { useState, useEffect } from "react";
import { View, FlatList, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { auth, db } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const HistoryScreen = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "users", user.uid, "messages"),
        orderBy("timestamp", "desc")
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const loaded = [];
        querySnapshot.forEach((doc) => {
          loaded.push({ id: doc.id, ...doc.data() });
        });
        setConversations(loaded);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </LinearGradient>
    );
  }

  const MessageCard = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: item.isUser ? "#6A0572" : "#AB47BC" }]}>
          <Ionicons 
            name={item.isUser ? "person" : "robot"} 
            size={20} 
            color="#FFFFFF" 
          />
        </View>
        <Text style={styles.user}>{item.isUser ? "You" : "AI Clone"}</Text>
        <Text style={styles.time}>
          {item.timestamp?.toDate ? new Date(item.timestamp.toDate()).toLocaleTimeString() : ""}
        </Text>
      </View>
      <Text style={styles.text} numberOfLines={3}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="history" size={28} color="#FFFFFF" />
        <Text style={styles.headerText}>Conversation History</Text>
        <View style={{ width: 40 }} />
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="chat-outline" size={64} color="#FFFFFF" />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Start chatting with your clone to see history</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageCard item={item} />}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 16,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  card: { 
    backgroundColor: "rgba(255, 255, 255, 0.9)", 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    elevation: 2,
    shadowColor: "#6A0572",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  user: { 
    fontWeight: "bold", 
    color: "#6A0572",
    flex: 1,
  },
  text: { 
    marginTop: 4, 
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  time: { 
    fontSize: 12, 
    color: "#999" 
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubtext: {
    color: "#E1BEE7",
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
});

export default HistoryScreen;
