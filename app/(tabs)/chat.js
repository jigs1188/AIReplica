import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    { id: 1, text: 'Hey, how are you doing today?', isUser: true, timestamp: new Date() },
    { id: 2, text: "I'm doing great! How can I help you?", isUser: false, timestamp: new Date() },
    { id: 3, text: 'Can you draft a quick reply to this email?', isUser: true, timestamp: new Date() },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedTone, setSelectedTone] = useState('Casual');
  const [isLoading, setIsLoading] = useState(false);
  const [trainingData, setTrainingData] = useState(null);
  const [showTemplates, setShowTemplates] = useState(true);

  const user = auth.currentUser;

  const quickTemplates = [
    {
      id: 1,
      icon: "💼",
      title: "Business Email",
      description: "Professional email response",
      prompt: "Help me draft a professional business email response"
    },
    {
      id: 2,
      icon: "💰",
      title: "Sales Pitch",
      description: "Compelling sales message",
      prompt: "Create a compelling sales pitch for my product"
    },
    {
      id: 3,
      icon: "🎯",
      title: "Decision Help",
      description: "Get guidance on choices",
      prompt: "Help me make a decision by asking the right questions"
    },
    {
      id: 4,
      icon: "✍️",
      title: "Content Writing",
      description: "Blog posts and articles",
      prompt: "Help me write engaging content for my audience"
    }
  ];

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
        if (loadedMessages.length > 0) {
          setMessages(loadedMessages);
          setShowTemplates(false);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = { 
      id: Date.now(), 
      text: inputMessage.trim(), 
      isUser: true, 
      timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowTemplates(false);

    try {
      // Save user message to Firebase
      if (user) {
        await addDoc(collection(db, "users", user.uid, "messages"), {
          text: userMessage.text,
          isUser: true,
          timestamp: serverTimestamp()
        });
      }

      const aiText = await getAIResponse([...messages, userMessage], selectedTone);
      const aiMessage = { 
        id: Date.now() + 1, 
        text: aiText, 
        isUser: false, 
        timestamp: new Date() 
      };
      
      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to Firebase
      if (user) {
        await addDoc(collection(db, "users", user.uid, "messages"), {
          text: aiMessage.text,
          isUser: false,
          timestamp: serverTimestamp()
        });
      }

    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        text: `${err.message}\n\n💡 **Quick Fix:**\n1. Check your internet connection\n2. Verify your OpenRouter API key\n3. Try again in a few moments`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setInputMessage(template.prompt);
    setShowTemplates(false);
  };

  const MessageBubble = ({ message, isUser }) => (
    <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
      <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
        {message}
      </Text>
    </View>
  );

  const TemplateCard = ({ template, onSelect }) => (
    <TouchableOpacity style={styles.templateCard} onPress={() => onSelect(template)}>
      <Text style={styles.templateIcon}>{template.icon}</Text>
      <Text style={styles.templateTitle}>{template.title}</Text>
      <Text style={styles.templateDescription}>{template.description}</Text>
    </TouchableOpacity>
  );

  const TypingIndicator = () => (
    <View style={styles.typingContainer}>
      <Text style={styles.typingText}>AI is thinking...</Text>
      <View style={styles.typingDots}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#6A0572", "#AB47BC", "#E1BEE7"]}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>💬 Chat with AI Clone</Text>
          <TouchableOpacity 
            onPress={() => setShowTemplates(!showTemplates)} 
            style={styles.templatesButton}
          >
            <MaterialCommunityIcons name="lightbulb-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Quick Templates */}
        {showTemplates && messages.length <= 3 && (
          <View style={styles.templatesContainer}>
            <Text style={styles.templatesTitle}>🎯 Quick Start Templates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
              {quickTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleTemplateSelect}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Messages */}
        <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
          {messages.length <= 3 && !showTemplates && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🤖</Text>
              <Text style={styles.emptyStateText}>Start a conversation!</Text>
              <Text style={styles.emptyStateSubtext}>Ask me anything or use a template above</Text>
            </View>
          )}
          
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message.text}
              isUser={message.isUser}
            />
          ))}
          
          {isLoading && <TypingIndicator />}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!inputMessage.trim() || isLoading) && styles.sendButtonDisabled]} 
              onPress={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              <MaterialCommunityIcons 
                name={isLoading ? "loading" : "send"} 
                size={24} 
                color={(!inputMessage.trim() || isLoading) ? "#999" : "#6A0572"} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Tone Selector */}
          <View style={styles.toneContainer}>
            {['Casual', 'Professional', 'Friendly'].map((tone) => (
              <TouchableOpacity
                key={tone}
                style={[styles.toneButton, selectedTone === tone && styles.toneButtonActive]}
                onPress={() => setSelectedTone(tone)}
              >
                <Text style={[styles.toneText, selectedTone === tone && styles.toneTextActive]}>
                  {tone}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  templatesButton: {
    padding: 8,
  },
  templatesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  templatesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  templatesScroll: {
    flexDirection: 'row',
  },
  templateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    width: 160,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  templateIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#6A0572',
  },
  aiText: {
    color: '#fff',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  typingText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginHorizontal: 1,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  toneContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  toneButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toneButtonActive: {
    backgroundColor: '#fff',
  },
  toneText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  toneTextActive: {
    color: '#6A0572',
  },
});