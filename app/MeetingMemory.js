import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import * as DocumentPicker from 'expo-document-picker';
import openai from '../openai';
import { auth, db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";

export default function MeetingMemoryScreen() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [trainingData, setTrainingData] = useState(null);

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

  const handleSummarize = async () => {
    if (!selectedFile) {
      Alert.alert("No file selected", "Please select a file to summarize.");
      return;
    }

    setLoading(true);
    setSummary('');

    let textToSummarize = fileContent;

    try {
      if (selectedFile.mimeType.startsWith('audio/')) {
        // Transcribe audio using OpenAI Whisper API
        const audioFile = await fetch(selectedFile.uri).then(res => res.blob());
        const transcriptionResponse = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
        });
        textToSummarize = transcriptionResponse.text;
      }

      // Summarize text using OpenAI Chat API
      const systemPrompt = {
        role: 'system',
        content: `You are an AI assistant that summarizes meetings and generates decisions and to-do lists in the user's style. Your name is ${trainingData?.name}. Your bio is: ${trainingData?.bio}. You should communicate in a ${trainingData?.communicationStyle} style. Here is a sample message from the user to learn from: ${trainingData?.sampleMessage}. Here is a sample email from the user to learn from: ${trainingData?.sampleEmail}. Summarize the following text, extract key decisions, and create a concise to-do list.`
      };

      const chatResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [systemPrompt, { role: 'user', content: textToSummarize }],
      });

      setSummary(chatResponse.choices[0].message.content);

    } catch (error) {
      console.error('Error during summarization:', error);
      Alert.alert("Error", "Failed to summarize the file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Meeting Memory</ThemedText>
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
      <Button title="Summarize" onPress={handleSummarize} disabled={!selectedFile || loading} />
      {loading && <ActivityIndicator style={styles.loadingIndicator} size="large" />}
      {summary && (
        <View style={styles.summaryContainer}>
          <ThemedText type="defaultSemiBold">Summary:</ThemedText>
          <ThemedText>{summary}</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
    marginTop: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
});
