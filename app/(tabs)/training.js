import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { auth, db } from '../../firebase';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TrainingScreen() {
  const [emailExample, setEmailExample] = useState("");
  const [messageExample, setMessageExample] = useState("");
  const [decisionExample, setDecisionExample] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    const fetchTrainingData = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid, "training", "examples");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setEmailExample(data.emailExample || "");
            setMessageExample(data.messageExample || "");
            setDecisionExample(data.decisionExample || "");
          }
        } catch (error) {
          console.log("Offline or network error:", error);
          // Use AsyncStorage as fallback when offline
          try {
            const stored = await AsyncStorage.getItem('@AIReplica_training');
            if (stored) {
              const data = JSON.parse(stored);
              setEmailExample(data.emailExample || "");
              setMessageExample(data.messageExample || "");
              setDecisionExample(data.decisionExample || "");
            }
          } catch (storageError) {
            console.log("Local storage error:", storageError);
          }
        }
      }
    };
    fetchTrainingData();
  }, [user]);

  const handleSave = async () => {
    if (user) {
      setIsLoading(true);
      try {
        await setDoc(doc(db, "users", user.uid, "training", "examples"), {
          emailExample,
          messageExample,
          decisionExample,
        });
        
        // Also save locally as backup
        const trainingData = { emailExample, messageExample, decisionExample };
        await AsyncStorage.setItem('@AIReplica_training', JSON.stringify(trainingData));
        
        Alert.alert("Success", "Training examples saved successfully.");
      } catch (error) {
        // If Firebase fails, save locally
        try {
          const trainingData = { emailExample, messageExample, decisionExample };
          await AsyncStorage.setItem('@AIReplica_training', JSON.stringify(trainingData));
          Alert.alert("Saved Locally", "Saved to device. Will sync when online.");
        } catch (_storageError) {
          Alert.alert("Error", "Failed to save training examples.");
        }
        console.error("Error saving training examples: ", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert("Not Logged In", "Please log in to save your training data.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="brain" size={28} color="#FFFFFF" />
          <ThemedText style={styles.headerText}>Training Center</ThemedText>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText style={styles.description}>
            Add examples of how you communicate to train your AI clone. The more examples you provide, the better your clone will mimic your style.
          </ThemedText>

          {/* Email Example */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email Example</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="E.g., Thank you for your email. I’ve reviewed the proposal..."
              placeholderTextColor="#9CA3AF"
              value={emailExample}
              onChangeText={setEmailExample}
              multiline
            />
          </View>

          {/* Message Example */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Message Example</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="E.g., Hey! Thanks for reaching out..."
              placeholderTextColor="#9CA3AF"
              value={messageExample}
              onChangeText={setMessageExample}
              multiline
            />
          </View>

          {/* Decision Example */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Decision Example</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="E.g., When deciding on meetings, I prioritize..."
              placeholderTextColor="#9CA3AF"
              value={decisionExample}
              onChangeText={setDecisionExample}
              multiline
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            disabled={isLoading}
          >
            <ThemedText style={styles.saveButtonText}>
              {isLoading ? "Saving..." : "Save Examples"}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  description: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#6A0572",
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: "#6A0572",
    fontSize: 16,
    fontWeight: "bold",
  },
});