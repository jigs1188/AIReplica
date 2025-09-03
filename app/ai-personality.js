import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AIPersonalityScreen() {
  const router = useRouter();
  const [communicationStyle, setCommunicationStyle] = useState("Professional");
  const [responseLength, setResponseLength] = useState("Medium");
  const [personalityTone, setPersonalityTone] = useState("Helpful");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const user = auth.currentUser;

  const communicationStyles = ["Professional", "Casual", "Friendly", "Formal", "Creative"];
  const responseLengths = ["Brief", "Medium", "Detailed", "Comprehensive"];
  const personalityTones = ["Helpful", "Enthusiastic", "Calm", "Witty", "Serious"];

  useEffect(() => {
    const loadPersonalitySettings = async () => {
      try {
        if (user) {
          const docRef = doc(db, "users", user.uid, "settings", "personality");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCommunicationStyle(data.communicationStyle || "Professional");
            setResponseLength(data.responseLength || "Medium");
            setPersonalityTone(data.personalityTone || "Helpful");
            setCustomInstructions(data.customInstructions || "");
          }
        } else {
          // Load from AsyncStorage as fallback
          const saved = await AsyncStorage.getItem("@AIReplica_personality");
          if (saved) {
            const data = JSON.parse(saved);
            setCommunicationStyle(data.communicationStyle || "Professional");
            setResponseLength(data.responseLength || "Medium");
            setPersonalityTone(data.personalityTone || "Helpful");
            setCustomInstructions(data.customInstructions || "");
          }
        }
      } catch (error) {
        console.error("Error loading personality settings:", error);
      }
    };

    loadPersonalitySettings();
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    const personalityData = {
      communicationStyle,
      responseLength,
      personalityTone,
      customInstructions,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (user) {
        await setDoc(doc(db, "users", user.uid, "settings", "personality"), personalityData);
        Alert.alert("Success", "AI personality settings saved successfully!");
      } else {
        // Save locally if not logged in
        await AsyncStorage.setItem("@AIReplica_personality", JSON.stringify(personalityData));
        Alert.alert("Saved Locally", "Settings saved to device. Will sync when you log in.");
      }
    } catch (error) {
      console.error("Error saving personality settings:", error);
      try {
        await AsyncStorage.setItem("@AIReplica_personality", JSON.stringify(personalityData));
        Alert.alert("Saved Locally", "Saved to device due to connection issue.");
      } catch (storageError) {
        Alert.alert("Error", "Failed to save personality settings.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const StyleButton = ({ options, selected, onSelect, title }) => (
    <View style={styles.styleSection}>
      <Text style={styles.styleTitle}>{title}</Text>
      <View style={styles.styleButtons}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.styleButton,
              selected === option && styles.selectedStyleButton,
            ]}
            onPress={() => onSelect(option)}
          >
            <Text
              style={[
                styles.styleButtonText,
                selected === option && styles.selectedStyleButtonText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="robot" size={28} color="#FFFFFF" />
        <Text style={styles.headerText}>AI Personality</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Customize how your AI clone communicates and responds to match your personality.
        </Text>

        {/* Communication Style */}
        <StyleButton
          title="Communication Style"
          options={communicationStyles}
          selected={communicationStyle}
          onSelect={setCommunicationStyle}
        />

        {/* Response Length */}
        <StyleButton
          title="Response Length"
          options={responseLengths}
          selected={responseLength}
          onSelect={setResponseLength}
        />

        {/* Personality Tone */}
        <StyleButton
          title="Personality Tone"
          options={personalityTones}
          selected={personalityTone}
          onSelect={setPersonalityTone}
        />

        {/* Custom Instructions */}
        <View style={styles.customSection}>
          <Text style={styles.styleTitle}>Custom Instructions</Text>
          <Text style={styles.customDescription}>
            Add specific instructions for how your AI clone should behave:
          </Text>
          <TextInput
            style={styles.customInput}
            placeholder="E.g., Always ask follow-up questions, Use technical terms, Be encouraging..."
            placeholderTextColor="#9CA3AF"
            value={customInstructions}
            onChangeText={setCustomInstructions}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? "Saving..." : "Save Personality Settings"}
          </Text>
        </TouchableOpacity>

        {/* Preview Section */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Current Settings Preview:</Text>
          <Text style={styles.previewText}>
            Style: {communicationStyle} | Length: {responseLength} | Tone: {personalityTone}
          </Text>
          {customInstructions && (
            <Text style={styles.previewCustom}>
              Custom: {customInstructions.substring(0, 100)}
              {customInstructions.length > 100 ? "..." : ""}
            </Text>
          )}
        </View>
      </ScrollView>
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
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingTop: 50,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
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
    marginBottom: 24,
    lineHeight: 22,
  },
  styleSection: {
    marginBottom: 24,
  },
  styleTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  styleButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  styleButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  selectedStyleButton: {
    backgroundColor: "#FFFFFF",
  },
  styleButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedStyleButtonText: {
    color: "#6A0572",
    fontWeight: "bold",
  },
  customSection: {
    marginBottom: 24,
  },
  customDescription: {
    color: "#E1BEE7",
    fontSize: 14,
    marginBottom: 12,
  },
  customInput: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    minHeight: 100,
  },
  saveButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  saveButtonText: {
    color: "#6A0572",
    fontSize: 16,
    fontWeight: "bold",
  },
  previewSection: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
  },
  previewTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  previewText: {
    color: "#E1BEE7",
    fontSize: 14,
    marginBottom: 8,
  },
  previewCustom: {
    color: "#E1BEE7",
    fontSize: 12,
    fontStyle: "italic",
  },
});
