import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet, Alert, ActivityIndicator, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import * as DocumentPicker from 'expo-document-picker';
import { auth, db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getEnhancedAIResponse } from '../utils/aiSettings';

export default function MeetingMemoryScreen() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [summary, setSummary] = useState('');
  
  const [trainingData, setTrainingData] = useState(null);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const user = auth.currentUser;

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
  }, [user]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      console.log('DocumentPicker result:', result); // Log the result for debugging

      if (result.canceled) {
        Alert.alert("Selection Cancelled", "You cancelled the document selection.");
        setSelectedFile(null);
        setFileContent('');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setSelectedFile(selectedAsset);
        console.log('Selected File Asset:', selectedAsset); // Log the selected asset

        if (selectedAsset.mimeType.startsWith('text/') || selectedAsset.mimeType === 'application/json') {
          try {
            const response = await fetch(selectedAsset.uri);
            const text = await response.text();
            setFileContent(text);
            console.log('File Content (Text/JSON):', text); // Log the content
          } catch (fetchError) {
            console.error('Error reading text/json file:', fetchError);
            Alert.alert("Error", "Failed to read the selected text/JSON file.");
            setFileContent('Error reading file content.');
          }
        } else if (selectedAsset.mimeType.startsWith('audio/')) {
          setFileContent("Audio file selected. Ready for transcription.");
          console.log('File Content (Audio):', "Audio file selected. Ready for transcription.");
        } else {
          setFileContent(`Unsupported file type: ${selectedAsset.mimeType}. Please select a text, JSON, or audio file.`);
          Alert.alert("Unsupported Type", `This app only supports text, JSON, and audio files. You selected a ${selectedAsset.mimeType} file.`);
        }
      } else {
        Alert.alert("No File Selected", "No file was selected or an unknown error occurred.");
        setSelectedFile(null);
        setFileContent('');
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert("Error", `Failed to pick a document: ${err.message || 'Unknown error'}.`);
    }
  };

  const handleGenerateSummary = async () => {
    const textInput = meetingNotes.trim();
    const isAudioFile = selectedFile && selectedFile.mimeType && selectedFile.mimeType.startsWith('audio/');

    if (!textInput && !selectedFile) {
      Alert.alert("No content", "Please type some notes or select a file to summarize.");
      return;
    }

    setIsLoading(true);
    setSummary('');
    let textToSummarize = textInput;

    try {
      // Step 1: If an audio file is selected, inform user that transcription is not available
      if (isAudioFile) {
        Alert.alert(
          "Audio Transcription", 
          "Audio transcription is not available with the current API. Please convert your audio to text manually or upload a text file.",
          [
            {
              text: "OK",
              onPress: () => {
                setIsLoading(false);
              }
            }
          ]
        );
        return;
      }

      // Use file content if available, otherwise use typed notes
      if (selectedFile && fileContent && !isAudioFile) {
        textToSummarize = fileContent;
      }

      if (!textToSummarize) {
          Alert.alert("No text", "The file appears to be empty or could not be read.");
          setIsLoading(false);
          return;
      }

      // Step 2: Summarize the text using centralized AI settings
      const systemPrompt = `You are an AI assistant that summarizes meetings and generates decisions and to-do lists in the user's style. Your name is ${trainingData?.name || 'AI Assistant'}. Your bio is: ${trainingData?.bio || 'N/A'}. You should communicate in a ${trainingData?.communicationStyle || 'professional'} style. Here is a sample message from the user to learn from: ${trainingData?.sampleMessage || 'N/A'}. Here is a sample email from the user to learn from: ${trainingData?.sampleEmail || 'N/A'}. Summarize the following text, extract key decisions, and create a concise to-do list.`;

      const conversationMessages = [
        { role: 'user', content: textToSummarize }
      ];

      const summaryContent = await getEnhancedAIResponse(conversationMessages, systemPrompt);
      setSummary(summaryContent);

    } catch (error) {
      console.error("Error during summarization:", error);
      Alert.alert("Summarization Error", error.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="calendar-check" size={28} color="#FFFFFF" />
          <Text style={styles.headerText}>Meeting Memory</Text>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.description}>
            Upload meeting notes or audio to generate summaries, decisions, and action items.
          </Text>

          {/* Meeting Notes Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meeting Notes</Text>
            <TextInput
              style={styles.input}
              placeholder="Type or paste your meeting notes here..."
              placeholderTextColor="#9CA3AF"
              value={meetingNotes}
              onChangeText={setMeetingNotes}
              multiline
            />
          </View>

          {/* Select a file button */}
          <Button title="Select a file" onPress={handlePickDocument} />
          {selectedFile && (
            <View style={styles.fileInfo}>
              <ThemedText>Selected File: {selectedFile.name}</ThemedText>
            </View>
          )}
          {fileContent && (
            <View style={styles.fileContent}>
              <ThemedText type="defaultSemiBold">File Content:</ThemedText>
              <ThemedText>{fileContent}</ThemedText>
            </View>
          )}

          {/* Generate Summary Button */}
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateSummary}
            disabled={isLoading}
          >
            <Text style={styles.generateButtonText}>
              {isLoading ? "Generating..." : "Generate Summary"}
            </Text>
          </TouchableOpacity>

          {/* Summary Output */}
          {summary ? (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          ) : null}

          
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  generateButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  generateButtonText: {
    color: "#6A0572",
    fontSize: 16,
    fontWeight: "bold",
  },
  fileInfo: {
    marginTop: 16,
  },
  fileContent: {
    marginTop: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  loadingIndicator: {
    marginTop: 20,
  },
  summaryContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
  },
  summaryTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  summaryText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
