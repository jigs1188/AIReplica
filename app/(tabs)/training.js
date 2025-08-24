import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Button, Alert } from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import TrainingInput from '../../components/training/TrainingInput';
import { auth, db } from '../../firebase';
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function TrainingScreen() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [sampleMessage, setSampleMessage] = useState('');
  const [sampleEmail, setSampleEmail] = useState('');

  const user = auth.currentUser;

  useEffect(() => {
    const fetchTrainingData = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || '');
          setBio(data.bio || '');
          setCommunicationStyle(data.communicationStyle || '');
          setSampleMessage(data.sampleMessage || '');
          setSampleEmail(data.sampleEmail || '');
        }
      }
    };
    fetchTrainingData();
  }, [user]);

  const handleSave = async () => {
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          name,
          bio,
          communicationStyle,
          sampleMessage,
          sampleEmail,
        });
        Alert.alert("Success", "Training data saved successfully.");
      } catch (error) {
        Alert.alert("Error", "Failed to save training data.");
        console.error("Error saving training data: ", error);
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <ThemedText type="title" style={styles.title}>Train Your AI Clone</ThemedText>
        
        <TrainingInput
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="What is your AI's name?"
        />
        
        <TrainingInput
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell me about your AI. What is its backstory?"
        />
        
        <TrainingInput
          label="Communication Style"
          value={communicationStyle}
          onChangeText={setCommunicationStyle}
          placeholder="How does your AI communicate? (e.g., formal, casual, witty)"
        />

        <TrainingInput
          label="Sample Message Reply"
          value={sampleMessage}
          onChangeText={setSampleMessage}
          placeholder="Write a sample reply to a message in your style."
          multiline
        />

        <TrainingInput
          label="Sample Email Reply"
          value={sampleEmail}
          onChangeText={setSampleEmail}
          placeholder="Write a sample reply to an email in your style."
          multiline
        />

        <Button title="Save Training Data" onPress={handleSave} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginTop: 48,
    marginBottom: 32,
    textAlign: 'center',
  },
});