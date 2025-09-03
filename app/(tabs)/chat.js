import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import DecisionBot from '../../components/DecisionBot';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColor } from '../../hooks/useThemeColor';

async function getAIResponse(messages, tone = "Casual") {
  // Check if API key is configured
  const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("your_actual_openrouter_api_key_here")) {
    throw new Error("❌ OpenRouter API key not configured.\n\n📝 Steps to fix:\n1. Visit https://openrouter.ai\n2. Create account & get free API key\n3. Update .env file with your key\n4. Restart the app");
  }

  const systemPrompt = {
    role: "system",
    content: `You are acting as my AI clone. Respond in a ${tone.toLowerCase()} tone.`,
  };

  const payload = {
    model: "deepseek/deepseek-chat",
    messages: [systemPrompt, ...messages.map(m => ({
      role: m.isUser ? "user" : "assistant",
      content: m.text,
    }))],
  };

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://aireplica.app",
        "X-Title": "AI Replica App",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API Error:", response.status, errorData);
      
      if (response.status === 401) {
        throw new Error("🔑 Invalid OpenRouter API key.\n\nGet a new key: https://openrouter.ai");
      }
      if (response.status === 429) {
        throw new Error("⏱️ Rate limit exceeded.\n\nTry again in a moment.");
      }
      if (errorData.error?.message?.includes("insufficient") || errorData.error?.message?.includes("balance")) {
        throw new Error("💳 Insufficient API balance.\n\n🆓 Get a free key with credits:\nhttps://openrouter.ai");
      }
      
      throw new Error(errorData.error?.message || `❌ API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response";
  } catch (error) {
    console.error("AI Response Error:", error);
    throw error;
  }
}

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hey, how are you doing today?', isUser: true },
    { id: 2, text: "I'm doing great! How can I help you?", isUser: false },
    { id: 3, text: 'Can you draft a quick reply to this email?', isUser: true },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedTone, setSelectedTone] = useState('Casual');
  const [isLoading, setIsLoading] = useState(false);
  const [trainingData, setTrainingData] = useState(null);

  const user = auth.currentUser;

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');
  const userMessageBackgroundColor = useThemeColor({}, 'tint');
  const aiMessageBackgroundColor = useThemeColor({}, 'background');

  useFocusEffect(
    useCallback(() => {
      const getSelectedPrompt = async () => {
        const selectedPrompt = await AsyncStorage.getItem('selectedPrompt');
        if (selectedPrompt) {
          setInputMessage(selectedPrompt);
          await AsyncStorage.removeItem('selectedPrompt');
        }
      };
      getSelectedPrompt();
    }, [])
  );

  useEffect(() => {
    const fetchTrainingData = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTrainingData(docSnap.data());
        }
      }
    };
    fetchTrainingData();

    if (user) {
      const q = query(collection(db, "users", user.uid, "messages"), orderBy("timestamp"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const loadedMessages = [];
        querySnapshot.forEach((doc) => {
          loadedMessages.push({ id: doc.id, ...doc.data() });
        });
        setMessages(loadedMessages);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMessage = { id: messages.length + 1, text: inputMessage, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiText = await getAIResponse([...messages, userMessage], selectedTone);
      setMessages(prev => [...prev, { id: prev.length + 1, text: aiText, isUser: false }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: prev.length + 1, text: "AI error: " + err.message, isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt) => {
    setInputMessage(prompt);
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageContainer, item.isUser ? {...styles.userMessage, backgroundColor: userMessageBackgroundColor} : {...styles.aiMessage, backgroundColor: aiMessageBackgroundColor}]}>
            <ThemedText>{item.text}</ThemedText>
          </View>
        )}
      />
      <DecisionBot onPromptClick={handlePromptClick} />
      <View style={[styles.inputContainer, { borderTopColor: borderColor }]}>
        <TextInput
          style={[styles.input, { borderColor: borderColor, color: textColor }]}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Type your message..."
          placeholderTextColor={borderColor}
        />
        <Button title="Templates" onPress={() => router.push('/prompts')} />
        <Button title="Send" onPress={handleSendMessage} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  messageContainer: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    padding: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
});