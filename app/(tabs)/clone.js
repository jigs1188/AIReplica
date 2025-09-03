import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { SlideInLeft, SlideInRight } from "react-native-reanimated";
import { auth, db } from "../../firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, getDoc, deleteDoc, getDocs } from "firebase/firestore";
import { useRouter } from "expo-router";
import { getEnhancedAIResponse } from "../../utils/aiSettings";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CloneScreen() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState("Casual");
  const [trainingData, setTrainingData] = useState(null);
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [showDecisionTemplates, setShowDecisionTemplates] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  
  const user = auth.currentUser;
  const router = useRouter();

  const tones = ["Casual", "Professional", "Friendly", "Witty"];
  
  const decisionTemplates = [
    {
      title: "Business Decision",
      prompt: "Help me analyze this business decision. Consider the pros, cons, risks, and potential outcomes:",
      icon: "briefcase",
      color: "#6A0572"
    },
    {
      title: "Career Choice",
      prompt: "I need advice on this career decision. Please evaluate the opportunities, growth potential, and alignment with my goals:",
      icon: "school",
      color: "#AB47BC"
    },
    {
      title: "Investment Analysis",
      prompt: "Analyze this investment opportunity. Consider the financial implications, risks, timeline, and expected returns:",
      icon: "chart-line",
      color: "#8E44AD"
    },
    {
      title: "Life Decision",
      prompt: "Help me think through this personal decision. What factors should I consider and what would you recommend:",
      icon: "heart",
      color: "#E74C3C"
    }
  ];

  useEffect(() => {
    if (!user) return;

    const fetchTrainingData = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTrainingData(docSnap.data());
      }
    };
    fetchTrainingData();

    const q = query(collection(db, "users", user.uid, "clone_messages"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const loadedMessages = [];
      querySnapshot.forEach((doc) => {
        loadedMessages.push({ id: doc.id, ...doc.data() });
      });
      setMessages(loadedMessages);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      Alert.alert("Empty Message", "Please enter a message before sending.");
      return;
    }
    
    if (!user) {
      Alert.alert("Authentication Required", "Please sign in to use the decision bot.");
      return;
    }
    
    if (isLoading) {
      return; // Prevent multiple simultaneous requests
    }

    const userMessageText = inputMessage.trim();
    const userMessage = {
      text: userMessageText,
      isUser: true,
      timestamp: serverTimestamp(),
    };

    setInputMessage("");
    setIsLoading(true);
    setIsTyping(true);
    setShowDecisionTemplates(false);

    try {
      await addDoc(collection(db, "users", user.uid, "clone_messages"), userMessage);

      // Build conversation messages in the correct format for the AI
      // Filter out error messages and limit to last 10 exchanges (20 messages)
      const validMessages = messages.filter(msg => 
        !msg.text.includes("Error:") && 
        !msg.text.includes("Invalid input") && 
        !msg.text.includes("Insufficient Balance") &&
        msg.text.trim() !== ""
      ).slice(-20); // Last 20 messages (10 exchanges)
      
      const conversationMessages = [
        ...validMessages.map(msg => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.text || "No content"
        })),
        {
          role: "user", 
          content: userMessageText
        }
      ];

      const systemPrompt = `You are an intelligent decision-making AI clone. Respond in a ${selectedTone.toLowerCase()} tone. When helping with decisions, provide clear reasoning, consider pros and cons, and offer actionable recommendations. Be concise but thorough.`;
      
      console.log("Sending to AI:", { conversationMessages, systemPrompt });
      const aiText = await getEnhancedAIResponse(conversationMessages, systemPrompt);
      console.log("Received AI response:", aiText);

      if (!aiText || aiText.trim() === "") {
        throw new Error("Received empty response from AI service.");
      }

      const aiMessage = {
        text: aiText,
        isUser: false,
        timestamp: serverTimestamp(),
      };
      await addDoc(collection(db, "users", user.uid, "clone_messages"), aiMessage);

    } catch (err) {
      console.error("Error sending message:", err);
      const errorMessage = {
        text: `❌ ${err.message || "Something went wrong. Please try again."}

💡 If this persists, check your internet connection and API settings.`,
        isUser: false,
        timestamp: serverTimestamp(),
      };
      
      // Add error message to chat
      try {
        await addDoc(collection(db, "users", user.uid, "clone_messages"), errorMessage);
      } catch (firebaseError) {
        console.error("Failed to save error message:", firebaseError);
        Alert.alert("Error", "Failed to save message. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleUseTemplate = (template) => {
    setInputMessage(template.prompt);
    setShowDecisionTemplates(false);
  };

  // Delete functionality
  const testFirebaseDelete = async () => {
    console.log("Testing Firebase delete permissions...");
    
    if (!user) {
      Alert.alert("Error", "Not logged in");
      return;
    }

    try {
      // Test by trying to delete the first message
      if (messages.length > 0) {
        const firstMessage = messages[0];
        console.log("Attempting to delete message:", firstMessage.id);
        
        const docRef = doc(db, "users", user.uid, "clone_messages", firstMessage.id);
        await deleteDoc(docRef);
        console.log("Single message delete successful!");
        Alert.alert("Test Success", "Firebase delete works! Message deleted.");
      } else {
        Alert.alert("No Messages", "Add a message first to test delete");
      }
    } catch (error) {
      console.error("Firebase delete test failed:", error);
      Alert.alert("Test Failed", `Firebase Error: ${error.message}`);
    }
  };

  const cleanStartFunction = async () => {
    console.log("Starting clean start operation...");
    
    if (!user) {
      Alert.alert("Authentication Required", "Please sign in first.");
      return;
    }

    Alert.alert(
      "Clean Start",
      "🧹 This will delete all messages AND reset AI settings. Start fresh?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clean Start", 
          style: "destructive", 
          onPress: async () => {
            setIsLoading(true);
            try {
              // 1. Delete all Firebase messages
              const messagesRef = collection(db, "users", user.uid, "clone_messages");
              const q = query(messagesRef);
              const querySnapshot = await getDocs(q);
              
              for (const docSnapshot of querySnapshot.docs) {
                await deleteDoc(doc(db, "users", user.uid, "clone_messages", docSnapshot.id));
              }
              
              // 2. Clear local state
              setMessages([]);
              
              // 3. Clear cached settings
              await AsyncStorage.removeItem('appSettings');
              await AsyncStorage.removeItem('aiSettings');
              
              setShowDeleteOptions(false);
              Alert.alert("Clean Start Complete", "🌟 Everything cleared! Ready for a fresh start.");
            } catch (error) {
              console.error("Clean start error:", error);
              Alert.alert("Error", "Failed to complete clean start.");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const forceModelReset = async () => {
    console.log("Forcing model reset to working free model...");
    try {
      // Clear AsyncStorage AI settings
      await AsyncStorage.removeItem('appSettings');
      await AsyncStorage.removeItem('aiSettings');
      
      Alert.alert("Settings Reset", "AI model reset to Google Gemma free. Try sending a message now.");
    } catch (error) {
      console.error("Error resetting settings:", error);
      Alert.alert("Error", "Failed to reset settings");
    }
  };

  const testAutoReplyIntegration = async () => {
    try {
      console.log('🧪 Testing auto-reply integration from clone page...');
      
      // Import auto-reply service
      const { autoReplyService } = await import('../../utils/autoReplyService');
      
      // Test with a sample message
      const testMessage = "Hi, I need help with decision making. Can you assist me?";
      const result = await autoReplyService.simulateIncomingMessage(
        testMessage,
        'whatsapp', // Test with WhatsApp
        'test_user',
        'decision_support'
      );
      
      if (result.success) {
        Alert.alert(
          'Auto-Reply Test Success! 🎉',
          `Test message: "${testMessage}"\n\nAI Response: "${result.response}"\n\nContext: ${result.context?.type || 'general'}`,
          [
            { text: 'OK' },
            { text: 'Open Auto-Reply Settings', onPress: () => router.push('/auto-reply') }
          ]
        );
      } else {
        Alert.alert('Auto-Reply Test Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Auto-reply test error:', error);
      Alert.alert('Test Error', 'Failed to test auto-reply integration: ' + error.message);
    }
  };

  const clearConversationTest = () => {
    console.log("Manual clear test - clearing local messages");
    setMessages([]);
    Alert.alert("Test", "Local messages cleared for testing");
  };

  const directDeleteAll = async () => {
    if (!user) {
      Alert.alert("Error", "Not logged in");
      return;
    }

    console.log("Direct delete - clearing local first");
    
    // 1. Immediately clear local messages
    setMessages([]);
    
    try {
      // 2. Get all message documents
      const messagesCollection = collection(db, "users", user.uid, "clone_messages");
      const snapshot = await getDocs(messagesCollection);
      
      console.log("Direct delete - found docs:", snapshot.size);
      
      // 3. Delete each document directly
      const deleteOperations = [];
      snapshot.forEach((document) => {
        console.log("Adding delete operation for:", document.id);
        deleteOperations.push(deleteDoc(document.ref));
      });
      
      // 4. Execute all deletions
      if (deleteOperations.length > 0) {
        await Promise.all(deleteOperations);
        console.log("All delete operations completed");
      }
      
      Alert.alert("Deleted!", `${deleteOperations.length} messages deleted from Firebase`);
      
    } catch (error) {
      console.error("Direct delete failed:", error);
      Alert.alert("Error", `Delete failed: ${error.code || error.message}`);
    }
  };

  const forceDeleteAllMessages = async () => {
    console.log("Force delete all messages - immediate action");
    
    if (!user) {
      Alert.alert("Authentication Required", "Please sign in to delete chats.");
      return;
    }

    setIsLoading(true);
    setShowDeleteOptions(false);
    
    try {
      // 1. Immediately clear local state
      setMessages([]);
      console.log("Local messages cleared immediately");
      
      // 2. Delete from Firebase in background
      const messagesRef = collection(db, "users", user.uid, "clone_messages");
      const querySnapshot = await getDocs(messagesRef);
      
      console.log("Firebase query complete. Documents found:", querySnapshot.docs.length);
      
      if (querySnapshot.docs.length > 0) {
        // Delete all documents
        const deletePromises = querySnapshot.docs.map(docSnapshot => {
          console.log("Queuing delete for:", docSnapshot.id);
          return deleteDoc(doc(db, "users", user.uid, "clone_messages", docSnapshot.id));
        });
        
        await Promise.all(deletePromises);
        console.log("All Firebase documents deleted successfully");
      }
      
      Alert.alert("Success", "🗑️ All messages deleted permanently!");
      
    } catch (error) {
      console.error("Force delete error:", error);
      Alert.alert("Error", `Delete failed: ${error.message}`);
      // Even if Firebase fails, keep local state cleared
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllChats = async () => {
    console.log("Delete all chats called, user:", user?.uid);
    
    if (!user) {
      Alert.alert("Authentication Required", "Please sign in to delete chats.");
      return;
    }

    Alert.alert(
      "Delete All Chats",
      "⚠️ This will permanently delete ALL your decision bot conversations. This cannot be undone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete All", 
          style: "destructive", 
          onPress: async () => {
            console.log("Starting delete all operation...");
            setIsLoading(true);
            try {
              const messagesRef = collection(db, "users", user.uid, "clone_messages");
              const q = query(messagesRef, orderBy("timestamp", "desc"));
              const querySnapshot = await getDocs(q);
              
              console.log("Query completed. Found documents to delete:", querySnapshot.docs.length);
              
              if (querySnapshot.empty || querySnapshot.docs.length === 0) {
                console.log("No documents found to delete");
                Alert.alert("No Messages", "No messages to delete.");
                setShowDeleteOptions(false);
                setIsLoading(false);
                return;
              }
              
              // Delete documents one by one for better error handling
              let deletedCount = 0;
              for (const docSnapshot of querySnapshot.docs) {
                try {
                  console.log("Deleting document:", docSnapshot.id);
                  const docRef = doc(db, "users", user.uid, "clone_messages", docSnapshot.id);
                  await deleteDoc(docRef);
                  deletedCount++;
                  console.log(`Successfully deleted ${deletedCount}/${querySnapshot.docs.length}`);
                } catch (deleteError) {
                  console.error("Failed to delete document:", docSnapshot.id, deleteError);
                }
              }
              
              console.log(`Deletion complete: ${deletedCount}/${querySnapshot.docs.length} messages deleted`);
              
              // Wait a moment for Firebase listener to update
              setTimeout(() => {
                // Clear local state as backup
                setMessages([]);
                setShowDeleteOptions(false);
                Alert.alert("Success", `🗑️ ${deletedCount} messages deleted successfully!`);
              }, 1000);
            } catch (error) {
              console.error("Error deleting chats:", error);
              Alert.alert("Error", "❌ Failed to delete chats. Please try again.");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteLastMessage = async () => {
    if (!user || messages.length === 0) return;

    Alert.alert(
      "Delete Last Message",
      "Delete the most recent message?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              const lastMessage = messages[messages.length - 1];
              await deleteDoc(doc(db, "users", user.uid, "clone_messages", lastMessage.id));
              Alert.alert("Success", "Last message deleted!");
            } catch (error) {
              console.error("Error deleting last message:", error);
              Alert.alert("Error", "Failed to delete last message.");
            }
          }
        }
      ]
    );
  };

  const handleDeleteMessage = async (messageId) => {
    console.log("Delete message called, messageId:", messageId, "user:", user?.uid);
    
    if (!user || !messageId) return;

    Alert.alert(
      "Delete Message",
      "Delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            console.log("Starting delete message operation for:", messageId);
            try {
              await deleteDoc(doc(db, "users", user.uid, "clone_messages", messageId));
              console.log("Message deleted successfully:", messageId);
              Alert.alert("Success", "Message deleted!");
            } catch (error) {
              console.error("Error deleting message:", error);
              Alert.alert("Error", "Failed to delete message.");
            }
          }
        }
      ]
    );
  };

  const DecisionTemplate = ({ template }) => (
    <TouchableOpacity 
      style={[styles.decisionTemplate, { borderLeftColor: template.color }]}
      onPress={() => handleUseTemplate(template)}
    >
      <View style={styles.templateHeader}>
        <MaterialCommunityIcons name={template.icon} size={24} color={template.color} />
        <Text style={styles.templateTitle}>{template.title}</Text>
      </View>
      <Text style={styles.templatePrompt} numberOfLines={2}>
        {template.prompt}
      </Text>
      <TouchableOpacity 
        style={[styles.useTemplateButton, { backgroundColor: template.color }]}
        onPress={() => handleUseTemplate(template)}
      >
        <Text style={styles.useTemplateText}>Use Template</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="chat-outline" size={64} color="#E1BEE7" />
      <Text style={styles.emptyTitle}>Start Your Decision Journey</Text>
      <Text style={styles.emptySubtitle}>
        Ask for help with important decisions or use a template to get started
      </Text>
      <TouchableOpacity 
        style={styles.emptyActionButton}
        onPress={() => setShowDecisionTemplates(true)}
      >
        <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFFFFF" />
        <Text style={styles.emptyActionText}>View Templates</Text>
      </TouchableOpacity>
      <Text style={styles.tipText}>
        💡 Tip: Long press any message to delete it individually
      </Text>
    </View>
  );

  const TypingIndicator = () => (
    <Animated.View entering={SlideInLeft} style={styles.typingBubble}>
      <Text style={styles.typingText}>AI is thinking</Text>
      <View style={styles.typingDots}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View>
    </Animated.View>
  );

  return (
    <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
      {/* Header with Account Info */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="robot-outline" size={28} color="#FFFFFF" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerText}>Decision Bot</Text>
            <Text style={styles.headerSubtext}>
              {trainingData?.name || user?.email?.split('@')[0] || 'AI Assistant'}
            </Text>
          </View>
        </View>
                <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.templatesButton}
            onPress={() => setShowDecisionTemplates(!showDecisionTemplates)}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.autoReplyTestButton}
            onPress={testAutoReplyIntegration}
          >
            <MaterialCommunityIcons name="robot" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => {
              console.log("Delete button pressed, current showDeleteOptions:", showDeleteOptions);
              setShowDeleteOptions(!showDeleteOptions);
            }}
          >
            <MaterialCommunityIcons name="delete" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.deleteButton, { backgroundColor: 'rgba(239, 68, 68, 0.8)' }]}
            onPress={directDeleteAll}
          >
            <MaterialCommunityIcons name="delete-forever" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.accountButton}
            onPress={() => setShowAccountInfo(!showAccountInfo)}
          >
            <MaterialCommunityIcons name="account" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Info Panel */}
      {showAccountInfo && (
        <Animated.View entering={SlideInLeft} style={styles.accountPanel}>
          <View style={styles.accountInfo}>
            <View style={styles.accountItem}>
              <MaterialCommunityIcons name="email" size={20} color="#6A0572" />
              <Text style={styles.accountText}>{user?.email || 'Not signed in'}</Text>
            </View>
            <View style={styles.accountItem}>
              <MaterialCommunityIcons name="robot" size={20} color="#6A0572" />
              <Text style={styles.accountText}>
                Clone Status: {trainingData ? 'Trained' : 'Basic'}
              </Text>
            </View>
            <View style={styles.accountItem}>
              <MaterialCommunityIcons name="message-text" size={20} color="#6A0572" />
              <Text style={styles.accountText}>Messages: {messages.length}</Text>
            </View>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => router.push('/ai-personality')}
            >
              <MaterialCommunityIcons name="cog" size={20} color="#FFFFFF" />
              <Text style={styles.settingsButtonText}>Customize Personality</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Delete Options Panel */}
      {showDeleteOptions && (
        <Animated.View entering={SlideInLeft} style={styles.deletePanel}>
          <View style={styles.deletePanelHeader}>
            <MaterialCommunityIcons name="delete" size={24} color="#DC2626" />
            <Text style={styles.deletePanelTitle}>Delete Chats</Text>
            <TouchableOpacity onPress={() => setShowDeleteOptions(false)}>
              <MaterialCommunityIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.deleteOptions}>
            <TouchableOpacity 
              style={[styles.deleteOptionButton, { backgroundColor: '#EF4444' }]}
              onPress={directDeleteAll}
            >
              <MaterialCommunityIcons name="delete-forever" size={20} color="#FFFFFF" />
              <Text style={[styles.deleteOptionText, { color: '#FFFFFF', fontWeight: 'bold' }]}>🗑️ DELETE ALL NOW</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.deleteOptionButton, { backgroundColor: '#10B981' }]}
              onPress={cleanStartFunction}
            >
              <MaterialCommunityIcons name="broom" size={20} color="#FFFFFF" />
              <Text style={[styles.deleteOptionText, { color: '#FFFFFF' }]}>Clean Start (Delete All + Reset)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.deleteOptionButton}
              onPress={testFirebaseDelete}
            >
              <MaterialCommunityIcons name="shield-check" size={20} color="#8B5CF6" />
              <Text style={styles.deleteOptionText}>Test Firebase Delete</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.deleteWarning}>
            ⚠️ Deleted messages cannot be recovered
          </Text>
        </Animated.View>
      )}

      {/* Decision Templates */}
      {showDecisionTemplates && (
        <Animated.View entering={SlideInLeft} style={styles.decisionTemplatesPanel}>
          <View style={styles.templatesHeader}>
            <Text style={styles.templatesTitle}>Decision Templates</Text>
            <TouchableOpacity onPress={() => setShowDecisionTemplates(false)}>
              <MaterialCommunityIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.templatesGrid}>
            {decisionTemplates.map((template, index) => (
              <DecisionTemplate key={index} template={template} />
            ))}
          </View>
        </Animated.View>
      )}

      {/* Tone Selector */}
      <View style={styles.toneSelector}>
        {tones.map((tone) => (
          <TouchableOpacity
            key={tone}
            style={[
              styles.toneButton,
              selectedTone === tone && styles.selectedToneButton
            ]}
            onPress={() => setSelectedTone(tone)}
          >
            <Text style={[
              styles.toneButtonText,
              selectedTone === tone && styles.selectedToneButtonText
            ]}>
              {tone}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => {
              console.log("Long press detected on message:", item.id, item.text?.substring(0, 50));
              handleDeleteMessage(item.id);
            }}
            activeOpacity={0.8}
          >
            <Animated.View
              entering={item.isUser ? SlideInRight : SlideInLeft}
              style={[
                styles.messageBubble,
                item.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <Text style={item.isUser ? styles.userText : styles.aiText}>{item.text}</Text>
            </Animated.View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.messagesContainer}
        inverted
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        ListEmptyComponent={!isTyping ? <EmptyState /> : null}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Ask for decision help or type your message..."
            placeholderTextColor="#9CA3AF"
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={styles.templatesToggle}
            onPress={() => setShowDecisionTemplates(!showDecisionTemplates)}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={18} color="#6A0572" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sendButton, (!inputMessage.trim() || isLoading) && styles.disabledSendButton]} 
            onPress={handleSendMessage} 
            disabled={!inputMessage.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
        {inputMessage.length > 0 && (
          <Text style={styles.characterCount}>{inputMessage.length}/500</Text>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 8,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtext: {
    color: "#E1BEE7",
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  templatesButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  accountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(220, 38, 38, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  autoReplyTestButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  accountPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  deletePanel: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  deletePanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  deletePanelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#DC2626",
    flex: 1,
    marginLeft: 8,
  },
  deleteOptions: {
    gap: 12,
  },
  deleteOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteAllButton: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FBBF24",
  },
  deleteOptionText: {
    fontSize: 16,
    color: "#F59E0B",
    fontWeight: "500",
    marginLeft: 8,
  },
  deleteAllText: {
    color: "#DC2626",
  },
  deleteWarning: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    transform: [{ scaleY: -1 }], // Since FlatList is inverted
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6A0572",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6A0572",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  emptyActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  clearButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  tipText: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
  accountInfo: {
    gap: 12,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accountText: {
    fontSize: 16,
    color: "#333",
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6A0572",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  settingsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  toneSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  toneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  selectedToneButton: {
    backgroundColor: "#FFFFFF",
  },
  toneButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  selectedToneButtonText: {
    color: "#6A0572",
    fontWeight: "bold",
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    elevation: 1,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#FFFFFF",
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: "#6A0572",
    fontSize: 16,
    lineHeight: 22,
  },
  aiText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    maxHeight: 100,
  },
  templatesToggle: {
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: "#6A0572",
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  disabledSendButton: {
    backgroundColor: "#9CA3AF",
  },
  characterCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  decisionTemplatesPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    margin: 16,
    borderRadius: 16,
    padding: 16,
    maxHeight: 300,
  },
  templatesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  templatesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  templatesGrid: {
    gap: 12,
  },
  decisionTemplate: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    elevation: 2,
  },
  templateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  templatePrompt: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
    marginBottom: 10,
  },
  useTemplateButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  useTemplateText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignSelf: "flex-start",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: "60%",
  },
  typingText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginRight: 8,
  },
  typingDots: {
    flexDirection: "row",
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  dot1: {
    opacity: 0.7,
  },
  dot2: {
    opacity: 0.5,
  },
  dot3: {
    opacity: 0.3,
  },
});
