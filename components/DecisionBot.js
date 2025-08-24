import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';

const prompts = [
  "Should I take this meeting?",
  "What caption should I write for this?",
  "Can you write a polite decline to this?",
];

const DecisionBot = ({ onPromptClick }) => {
  const containerBorderColor = useThemeColor({}, 'icon');
  const promptButtonBackgroundColor = useThemeColor({}, 'background');
  const promptTextColor = useThemeColor({}, 'text');

  return (
    <View style={[styles.container, { borderTopColor: containerBorderColor }]}>
      <ThemedText type="defaultSemiBold">Decision Bot</ThemedText>
      <View style={styles.promptsContainer}>
        {prompts.map((prompt, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.promptButton, { backgroundColor: promptButtonBackgroundColor }]}
            onPress={() => onPromptClick(prompt)}
          >
            <Text style={[styles.promptText, { color: promptTextColor }]}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderTopWidth: 1,
  },
  promptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  promptButton: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  promptText: {
    fontSize: 12,
  },
});

export default DecisionBot;