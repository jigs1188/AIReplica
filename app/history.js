import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const HistoryScreen = () => {
  const tintColor = useThemeColor({}, 'tint');
  const [history, setHistory] = useState([]);

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "users", user.uid, "messages"), orderBy("timestamp", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const loadedHistory = [];
        querySnapshot.forEach((doc) => {
          loadedHistory.push({ id: doc.id, ...doc.data() });
        });
        setHistory(loadedHistory);
      });
      return () => unsubscribe();
    }
  }, [user]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>History</ThemedText>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{...styles.historyItem, backgroundColor: tintColor}}>
            <ThemedText type="defaultSemiBold">{item.role === 'user' ? 'You' : 'AIReplica'}:</ThemedText>
            <ThemedText>{item.content}</ThemedText>
          </View>
        )}
      />
      <Link href="/dashboard" asChild>
        <TouchableOpacity style={{...styles.button, backgroundColor: tintColor}}>
          <ThemedText type="defaultSemiBold">Back to Dashboard</ThemedText>
        </TouchableOpacity>
      </Link>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginTop: 48,
    marginBottom: 32,
    textAlign: 'center',
  },
  historyItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
    alignItems: 'center',
  },
});

export default HistoryScreen;
