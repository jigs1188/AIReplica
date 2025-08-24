import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Button, Alert } from 'react-native';
import { Link } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { useThemeColor } from '../../hooks/useThemeColor';
import { auth, db } from '../../firebase';
import { doc, setDoc, getDoc } from "firebase/firestore";

const SettingsScreen = () => {
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const [personality, setPersonality] = useState('');
  const [apiKey, setApiKey] = useState('');

  const user = auth.currentUser;

  useEffect(() => {
    const fetchSettings = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPersonality(data.personality || '');
          setApiKey(data.apiKey || '');
        }
      }
    };
    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          personality,
          apiKey,
        }, { merge: true });
        Alert.alert("Success", "Settings saved successfully.");
      } catch (error) {
        Alert.alert("Error", "Failed to save settings.");
        console.error("Error saving settings: ", error);
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Settings</ThemedText>
      
      <View style={styles.settingItem}>
        <ThemedText type="defaultSemiBold">AI Personality</ThemedText>
        <TextInput
          style={{...styles.input, backgroundColor: tintColor, color: textColor}}
          placeholder="e.g., witty, sarcastic, professional"
          placeholderTextColor="#9ca3af"
          value={personality}
          onChangeText={setPersonality}
        />
      </View>

      <View style={styles.settingItem}>
        <ThemedText type="defaultSemiBold">OpenAI API Key</ThemedText>
        <TextInput
          style={{...styles.input, backgroundColor: tintColor, color: textColor}}
          placeholder="Enter your API key"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={apiKey}
          onChangeText={setApiKey}
        />
      </View>

      <Button title="Save Settings" onPress={handleSave} />

      <Link href="/dashboard" asChild>
        <TouchableOpacity style={{...styles.button, backgroundColor: tintColor}}>
          <ThemedText type="defaultSemiBold">Back to Dashboard</ThemedText>
        </TouchableOpacity>
      </Link>
    </ThemedView>
  );
};

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
  settingItem: {
    marginBottom: 24,
  },
  input: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
    alignItems: 'center',
  },
});

export default SettingsScreen;
