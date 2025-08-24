import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColor } from '../hooks/useThemeColor';

export default function CustomPromptsScreen() {
  const [prompts, setPrompts] = useState([]);
  const [input, setInput] = useState('');

  const user = auth.currentUser;

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');
  const destructiveColor = useThemeColor({}, 'destructive');

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "users", user.uid, "prompts"), orderBy("timestamp", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const loadedPrompts = [];
        querySnapshot.forEach((doc) => {
          loadedPrompts.push({ id: doc.id, ...doc.data() });
        });
        setPrompts(loadedPrompts);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleAddPrompt = async () => {
    if (input.trim() === '' || !user) return;

    await addDoc(collection(db, "users", user.uid, "prompts"), {
      text: input,
      timestamp: serverTimestamp(),
    });
    setInput('');
  };

  const handleDeletePrompt = async (promptId) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "prompts", promptId));
  };

  const handleUsePrompt = async (promptText) => {
    await AsyncStorage.setItem('selectedPrompt', promptText);
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Custom Prompts</ThemedText>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { borderColor: borderColor, color: textColor }]}
          value={input}
          onChangeText={setInput}
          placeholder="Enter a new prompt..."
          placeholderTextColor={borderColor}
        />
        <Button title="Add" onPress={handleAddPrompt} />
      </View>
      <FlatList
        data={prompts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.promptContainer, { borderBottomColor: borderColor }]}>
            <Text style={[styles.promptText, { color: textColor }]}>{item.text}</Text>
            <View style={styles.promptButtons}>
              <Button title="Use" onPress={() => handleUsePrompt(item.text)} />
              <Button title="Delete" onPress={() => handleDeletePrompt(item.id)} color={destructiveColor} />
            </View>
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 8,
  },
  promptContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  promptText: {
    flex: 1,
  },
  promptButtons: {
    flexDirection: 'row',
  },
});
