import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MessageBubble = ({ message, isUser }) => (
  <View className={`max-w-[70%] p-3 rounded-xl mb-2 ${isUser ? 'bg-gray-200 self-end' : 'bg-blue-500 self-start'}`}>
    <Text className={`${isUser ? 'text-gray-800' : 'text-white'}`}>{message}</Text>
  </View>
);

const AISuggestionBubble = ({ suggestion, onSendAsMe }) => (
  <View className="max-w-[80%] p-4 rounded-xl mb-3 bg-purple-500 shadow-lg self-start border border-purple-400">
    <Text className="text-white text-base mb-2">{suggestion}</Text>
    <TouchableOpacity
      className="bg-white px-4 py-2 rounded-full self-end"
      onPress={onSendAsMe}
    >
      <Text className="text-blue-700 font-semibold">Send as Me</Text>
    </TouchableOpacity>
  </View>
);

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hey, how are you doing today?', isUser: true },
    { id: 2, text: 'I\'m doing great! How can I help you?', isUser: false },
    { id: 3, text: 'Can you draft a quick reply to this email?', isUser: true },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedTone, setSelectedTone] = useState('Casual');

  const tones = ['Casual', 'Polite', 'Witty', 'Sarcastic'];

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([...messages, { id: messages.length + 1, text: inputMessage, isUser: true }]);
      setInputMessage('');
      // Simulate AI response/suggestion
      setTimeout(() => {
        setMessages(prevMessages => [
          ...prevMessages,
          { id: prevMessages.length + 1, text: 'Here is a suggested reply based on your tone preferences.', isUser: false, isSuggestion: true },
        ]);
      }, 1000);
    }
  };

  const handleSendAsMe = (suggestion) => {
    Alert.alert("Send as Me", `Sending: "${suggestion}"`);
    // In a real app, this would send the message through the appropriate channel
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Tone Toggle */}
      <View className="flex-row justify-around p-3 bg-white shadow-md">
        {tones.map((tone) => (
          <TouchableOpacity
            key={tone}
            className={`px-4 py-2 rounded-full ${selectedTone === tone ? 'bg-purple-600' : 'bg-gray-200'}`}
            onPress={() => setSelectedTone(tone)}
          >
            <Text className={`${selectedTone === tone ? 'text-white' : 'text-gray-700'}`}>{tone}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chat Area */}
      <ScrollView className="flex-1 p-4">
        {messages.map((msg) => (
          msg.isSuggestion ? (
            <AISuggestionBubble
              key={msg.id}
              suggestion={msg.text}
              onSendAsMe={() => handleSendAsMe(msg.text)}
            />
          ) : (
            <MessageBubble key={msg.id} message={msg.text} isUser={msg.isUser} />
          )
        ))}
      </ScrollView>

      {/* Message Input */}
      <View className="flex-row items-center p-4 bg-white border-t border-gray-200">
        <TextInput
          className="flex-1 p-3 bg-gray-100 rounded-full mr-3 text-gray-800"
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          value={inputMessage}
          onChangeText={setInputMessage}
          multiline
        />
        <TouchableOpacity
          className="bg-purple-600 p-3 rounded-full"
          onPress={handleSendMessage}
        >
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
