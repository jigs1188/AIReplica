import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '../../hooks/useThemeColor';

const TrainingInput = ({ label, value, onChangeText, placeholder, multiline }) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const placeholderTextColor = useThemeColor({}, 'icon');

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
      <TextInput
        style={[styles.input, { backgroundColor: backgroundColor, color: textColor }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        multiline={multiline}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
});

export default TrainingInput;