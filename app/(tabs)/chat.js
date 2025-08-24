import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import openai from '../../openai';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import DecisionBot from '../../components/DecisionBot';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
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
          setInput(selectedPrompt);
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

  const handleSend = async () => {
    if (input.trim() === '' || !user) return;

    const userMessage = { role: 'user', content: input, timestamp: serverTimestamp() };
    await addDoc(collection(db, "users", user.uid, "messages"), userMessage);
    setInput('');

    let systemPrompt;
    if (trainingData) {
      systemPrompt = {
        role: 'system',
        content: `You are an AI assistant that mimics the user\'s style. Your name is ${trainingData.name}. Your bio is: ${trainingData.bio}. You should communicate in a ${trainingData.communicationStyle} style. Here is a sample message from the user to learn from: ${trainingData.sampleMessage}. Here is a sample email from the user to learn from: ${trainingData.sampleEmail}.`
      }
    } else {
      systemPrompt = {
        role: 'system',
        content: 'You are a helpful AI assistant.'
      }
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [systemPrompt, ...messages.map(msg => ({role: msg.role, content: msg.content})), {role: 'user', content: input}],
      });

      console.log("OpenAI Response:", response);

      const aiMessageContent = response.choices[0].message.content;
      const aiMessage = { role: 'assistant', content: aiMessageContent, timestamp: serverTimestamp() };
      await addDoc(collection(db, "users", user.uid, "messages"), aiMessage);

    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error.', timestamp: serverTimestamp() };
      await addDoc(collection(db, "users", user.uid, "messages"), errorMessage);
    }
  };

  const handlePromptClick = (prompt) => {
    setInput(prompt);
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageContainer, item.role === 'user' ? {...styles.userMessage, backgroundColor: userMessageBackgroundColor} : {...styles.aiMessage, backgroundColor: aiMessageBackgroundColor}]}>
            <ThemedText>{item.content}</ThemedText>
          </View>
        )}
      />
      <DecisionBot onPromptClick={handlePromptClick} />
      <View style={[styles.inputContainer, { borderTopColor: borderColor }]}>
        <TextInput
          style={[styles.input, { borderColor: borderColor, color: textColor }]}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          placeholderTextColor={borderColor}
        />
        <Button title="Templates" onPress={() => router.push('/prompts')} />
        <Button title="Send" onPress={handleSend} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
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
