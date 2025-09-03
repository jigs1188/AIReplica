import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { getEnhancedAIResponse } from '../utils/aiSettings';

const MessageBubble = ({ message, isUser }) => (
  <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
    <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
      {message}
    </Text>
  </View>
);

const DecisionTemplate = ({ template, onSelect }) => (
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

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const router = useRouter();

  const decisionTemplates = [
    {
      id: 1,
      icon: "💼",
      title: "Career Decision",
      description: "Help me decide on career moves",
      prompt: "I need help making a career decision. Please ask me relevant questions about my situation, goals, and concerns to help me make the best choice."
    },
    {
      id: 2,
      icon: "💰",
      title: "Investment Choice",
      description: "Guide me through investment options",
      prompt: "I'm considering an investment decision. Please help me evaluate the options by asking about my financial goals, risk tolerance, and investment timeline."
    },
    {
      id: 3,
      icon: "🏠",
      title: "Life Decision",
      description: "Major life choices and changes",
      prompt: "I'm facing a major life decision and need guidance. Please ask me thoughtful questions to help me consider all aspects and make the best choice."
    },
    {
      id: 4,
      icon: "🚀",
      title: "Business Strategy",
      description: "Business and entrepreneurship decisions",
      prompt: "I need help with a business decision. Please guide me through the considerations by asking about market conditions, resources, and strategic goals."
    }
  ];

  const getAIResponse = async (userMessage) => {
    try {
      const messages = [
        {
          role: "user",
          content: userMessage
        }
      ];
      
      return await getEnhancedAIResponse(messages, "You are a helpful AI assistant that provides thoughtful and balanced advice. Be conversational, empathetic, and ask follow-up questions when appropriate to better understand the user's situation.");
    } catch (error) {
      throw error;
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setShowTemplates(false);

    // Add user message
    const newUserMessage = {
      id: Date.now(),
      text: userMessage,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Save user message to Firebase
      if (auth.currentUser) {
        await addDoc(collection(db, 'chat_messages'), {
          userId: auth.currentUser.uid,
          message: userMessage,
          isUser: true,
          timestamp: serverTimestamp()
        });
      }

      // Get AI response
      const aiResponse = await getAIResponse(userMessage);
      
      const newAIMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newAIMessage]);

      // Save AI response to Firebase
      if (auth.currentUser) {
        await addDoc(collection(db, 'chat_messages'), {
          userId: auth.currentUser.uid,
          message: aiResponse,
          isUser: false,
          timestamp: serverTimestamp()
        });
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: `${error.message}\n\n💡 **Quick Fix:**\n1. Check your internet connection\n2. Verify your OpenRouter API key\n3. Try again in a few moments`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setInputText(template.prompt);
    setShowTemplates(false);
  };

  // Load chat history from Firebase
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'chat_messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chatMessages = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId === auth.currentUser.uid) {
          chatMessages.push({
            id: doc.id,
            text: data.message,
            isUser: data.isUser,
            timestamp: data.timestamp?.toDate() || new Date()
          });
        }
      });
      
      // Only set messages if we have any, to avoid overwriting local state
      if (chatMessages.length > 0) {
        setMessages(chatMessages);
        setShowTemplates(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6A0572', '#AB47BC', '#E1BEE7']}
        style={styles.background}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>💬 Chat with AI</Text>
          <TouchableOpacity 
            onPress={() => setShowTemplates(!showTemplates)} 
            style={styles.templatesButton}
          >
            <MaterialCommunityIcons name="lightbulb-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {showTemplates && messages.length === 0 && (
          <View style={styles.templatesContainer}>
            <Text style={styles.templatesTitle}>🎯 Quick Start Templates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
              {decisionTemplates.map((template) => (
                <DecisionTemplate
                  key={template.id}
                  template={template}
                  onSelect={handleTemplateSelect}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
          {messages.length === 0 && !showTemplates && (
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

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <MaterialCommunityIcons 
              name={isLoading ? "loading" : "send"} 
              size={24} 
              color={(!inputText.trim() || isLoading) ? "#999" : "#6A0572"} 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

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
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default ChatScreen;