import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function PromptsScreen() {
  const [prompts, setPrompts] = useState([
    { id: 1, title: "Email Reply", text: "Thank you for your email. I'll review this and get back to you soon.", category: "Email" },
    { id: 2, title: "Meeting Request", text: "Let me check my calendar and confirm availability for the meeting.", category: "Meetings" },
    { id: 3, title: "Follow Up", text: "Just following up on our previous conversation. Any updates?", category: "Follow-up" },
    { id: 4, title: "Decline Politely", text: "Thank you for the invitation, but I won't be able to attend.", category: "Social" },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptText, setNewPromptText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Email");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const router = useRouter();
  const categories = ["Email", "Meetings", "Follow-up", "Social", "Business", "Personal", "Other"];

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const savedPrompts = await AsyncStorage.getItem("prompt_templates");
      if (savedPrompts) {
        setPrompts(JSON.parse(savedPrompts));
      }
    } catch (error) {
      console.error("Error loading prompts:", error);
    }
  };

  const savePrompts = async (updatedPrompts) => {
    try {
      await AsyncStorage.setItem("prompt_templates", JSON.stringify(updatedPrompts));
    } catch (error) {
      console.error("Error saving prompts:", error);
      Alert.alert("Error", "Failed to save prompts");
    }
  };

  const handleAddPrompt = async () => {
    if (!newPromptTitle.trim() || !newPromptText.trim()) {
      Alert.alert("Error", "Please fill in both title and text fields");
      return;
    }

    const newPrompt = {
      id: Date.now(),
      title: newPromptTitle.trim(),
      text: newPromptText.trim(),
      category: selectedCategory,
    };

    const updatedPrompts = [...prompts, newPrompt];
    setPrompts(updatedPrompts);
    await savePrompts(updatedPrompts);

    setNewPromptTitle("");
    setNewPromptText("");
    setShowAddForm(false);
    Alert.alert("Success", "Prompt template added successfully!");
  };

  const handleDeletePrompt = async (id) => {
    Alert.alert(
      "Delete Prompt",
      "Are you sure you want to delete this prompt template?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedPrompts = prompts.filter(prompt => prompt.id !== id);
            setPrompts(updatedPrompts);
            await savePrompts(updatedPrompts);
          }
        }
      ]
    );
  };

  const handleUsePrompt = (promptText) => {
    router.push({
      pathname: "/chat",
      params: { template: promptText }
    });
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "All" || prompt.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const PromptCard = ({ prompt }) => (
    <View style={styles.promptCard}>
      <View style={styles.promptHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{prompt.category.toUpperCase()}</Text>
        </View>
        <View style={styles.promptActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleUsePrompt(prompt.text)}>
            <MaterialCommunityIcons name="send" size={16} color="#6A0572" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDeletePrompt(prompt.id)}>
            <MaterialCommunityIcons name="delete" size={16} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.promptTitle}>{prompt.title}</Text>
      <Text style={styles.promptText} numberOfLines={3}>{prompt.text}</Text>
      <View style={styles.promptFooter}>
        <TouchableOpacity style={styles.useButton} onPress={() => handleUsePrompt(prompt.text)}>
          <Text style={styles.usePromptText}>Use in Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prompt Templates</Text>
        <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)}>
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search templates..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {["All", ...categories].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilter === filter && styles.selectedFilterButton]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterButtonText, selectedFilter === filter && styles.selectedFilterButtonText]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Add Form */}
      {showAddForm && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Template title..."
            placeholderTextColor="#9CA3AF"
            value={newPromptTitle}
            onChangeText={setNewPromptTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Template text..."
            placeholderTextColor="#9CA3AF"
            value={newPromptText}
            onChangeText={setNewPromptText}
            multiline
          />
          <View style={styles.categorySelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryButton, selectedCategory === category && styles.selectedCategoryButton]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[styles.categoryButtonText, selectedCategory === category && styles.selectedCategoryButtonText]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddForm(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleAddPrompt}>
              <Text style={styles.addButtonText}>Add Template</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Prompts List */}
      <ScrollView style={styles.promptsList} contentContainerStyle={styles.promptsContent}>
        {filteredPrompts.length > 0 ? (
          filteredPrompts.map((prompt) => <PromptCard key={prompt.id} prompt={prompt} />)
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="flash-outline" size={64} color="#FFFFFF" />
            <Text style={styles.emptyText}>No prompts yet</Text>
            <Text style={styles.emptySubtext}>Create your first prompt template</Text>
          </View>
        )}
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
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 50,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  searchSection: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  filterContainer: {
    flexDirection: "row",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  selectedFilterButton: {
    backgroundColor: "#FFFFFF",
  },
  filterButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedFilterButtonText: {
    color: "#6A0572",
    fontWeight: "bold",
  },
  addForm: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  categorySelector: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: "#6A0572",
  },
  categoryButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  selectedCategoryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    flex: 1,
    backgroundColor: "#6A0572",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  promptsList: {
    flex: 1,
  },
  promptsContent: {
    padding: 16,
  },
  promptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  promptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: "#6A0572",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  promptActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  promptText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
    marginBottom: 12,
  },
  promptFooter: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  useButton: {
    backgroundColor: "#6A0572",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  usePromptText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    color: "#E1BEE7",
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
});
