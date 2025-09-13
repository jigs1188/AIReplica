import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 👥 CONTACT MANAGER - PERSONALIZED AI FEATURES
 * Integrated within existing dashboard/integration hub
 */

export default function ContactManager() {
  const router = useRouter();
  const { platform } = useLocalSearchParams();
  const [contacts, setContacts] = useState([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [userResume, setUserResume] = useState('');
  const [editingContact, setEditingContact] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    number: '',
    name: '',
    role: 'general',
    theirPosition: '',
    customInstructions: '',
    autoConversation: false
  });

  const roleOptions = [
    { value: 'general', label: 'General Contact' },
    { value: 'hr', label: 'HR Professional' },
    { value: 'client', label: 'Client' },
    { value: 'manager', label: 'Manager/Supervisor' },
    { value: 'colleague', label: 'Colleague' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'friend', label: 'Friend' },
    { value: 'family', label: 'Family Member' },
    { value: 'business', label: 'Business Contact' }
  ];

  useEffect(() => {
    loadContacts();
    loadUserResume();
  }, []);

  const loadContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem('@personalized_contacts');
      if (stored) {
        setContacts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadUserResume = async () => {
    try {
      const stored = await AsyncStorage.getItem('@user_resume');
      if (stored) {
        setUserResume(stored);
      }
    } catch (error) {
      console.error('Error loading resume:', error);
    }
  };

  const saveContacts = async (updatedContacts) => {
    try {
      await AsyncStorage.setItem('@personalized_contacts', JSON.stringify(updatedContacts));
      setContacts(updatedContacts);
    } catch (error) {
      console.error('Error saving contacts:', error);
    }
  };

  const saveUserResume = async () => {
    try {
      await AsyncStorage.setItem('@user_resume', userResume);
      Alert.alert('Success', 'Your resume/background has been saved!');
    } catch (error) {
      console.error('Error saving resume:', error);
      Alert.alert('Error', 'Failed to save resume');
    }
  };

  const addOrUpdateContact = async () => {
    if (!contactForm.number || !contactForm.name) {
      Alert.alert('Error', 'Please provide at least a phone number/email and name');
      return;
    }

    const contactData = {
      ...contactForm,
      id: editingContact?.id || Date.now().toString(),
      platform: platform || 'whatsapp',
      createdAt: editingContact?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedContacts;
    if (editingContact) {
      updatedContacts = contacts.map(c => c.id === editingContact.id ? contactData : c);
    } else {
      updatedContacts = [...contacts, contactData];
    }

    await saveContacts(updatedContacts);
    setShowAddContact(false);
    setEditingContact(null);
    setContactForm({
      number: '',
      name: '',
      role: 'general',
      theirPosition: '',
      customInstructions: '',
      autoConversation: false
    });
  };

  const editContact = (contact) => {
    setContactForm(contact);
    setEditingContact(contact);
    setShowAddContact(true);
  };

  const deleteContact = (contactId) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedContacts = contacts.filter(c => c.id !== contactId);
            await saveContacts(updatedContacts);
          }
        }
      ]
    );
  };

  const toggleAutoConversation = async (contactId) => {
    const updatedContacts = contacts.map(contact => {
      if (contact.id === contactId) {
        return { ...contact, autoConversation: !contact.autoConversation };
      }
      return contact;
    });
    await saveContacts(updatedContacts);
  };

  const testPersonalizedResponse = (contact) => {
    Alert.prompt(
      'Test AI Response',
      `Enter a test message to see how AI would respond to ${contact.name}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test',
          onPress: (testMessage) => {
            if (testMessage) {
              // Simulate AI response based on contact profile
              const roleInstructions = getRoleInstructions(contact.role);
              Alert.alert(
                'AI Response Preview',
                `To: ${contact.name} (${contact.role})\n\nYour message: "${testMessage}"\n\nAI would respond with:\n"Hi ${contact.name}, ${roleInstructions.sample}"\n\nBased on:\n• Role: ${contact.role}\n• Custom instructions: ${contact.customInstructions || 'None'}\n• Your resume integration`
              );
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const getRoleInstructions = (role) => {
    const instructions = {
      hr: {
        style: 'professional and enthusiastic',
        sample: 'Thank you for reaching out! Im very interested in learning more about this opportunity.'
      },
      client: {
        style: 'professional and solution-focused',
        sample: 'I appreciate you contacting me. How can I help you achieve your goals?'
      },
      manager: {
        style: 'respectful and efficient',
        sample: 'I received your message and will provide an update shortly.'
      },
      recruiter: {
        style: 'professional and interested',
        sample: 'I\'m always open to discussing new opportunities that align with my experience.'
      },
      friend: {
        style: 'casual and friendly',
        sample: 'Hey! Good to hear from you. What\'s up?'
      },
      family: {
        style: 'warm and caring',
        sample: 'Hi there! Thanks for checking in. How are you doing?'
      }
    };
    return instructions[role] || instructions.general || { style: 'professional', sample: 'Thank you for your message.' };
  };

  const platformContacts = contacts.filter(c => !platform || c.platform === platform);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {platform ? `${platform.toUpperCase()} Contacts` : 'Contact Manager'}
          </Text>
          <TouchableOpacity 
            onPress={() => setShowAddContact(true)} 
            style={styles.addButton}
          >
            <MaterialCommunityIcons name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* User Resume Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Your Background/Resume</Text>
          <Text style={styles.sectionSubtitle}>
            This information will be used for professional conversations with HR, clients, etc.
          </Text>
          <TextInput
            style={styles.resumeInput}
            multiline
            numberOfLines={6}
            placeholder="Paste your resume or key background information here..."
            value={userResume}
            onChangeText={setUserResume}
          />
          <TouchableOpacity style={styles.saveResumeButton} onPress={saveUserResume}>
            <Text style={styles.saveResumeButtonText}>💾 Save Resume</Text>
          </TouchableOpacity>
        </View>

        {/* Contacts List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Personalized Contacts ({platformContacts.length})</Text>
          
          {platformContacts.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-plus" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No contacts configured yet</Text>
              <Text style={styles.emptySubtext}>Add contacts to enable personalized AI responses</Text>
            </View>
          ) : (
            platformContacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.contactHeader}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactNumber}>{contact.number}</Text>
                    <View style={styles.contactMeta}>
                      <View style={[styles.roleBadge, { backgroundColor: getRoleColor(contact.role) }]}>
                        <Text style={styles.roleBadgeText}>{contact.role.toUpperCase()}</Text>
                      </View>
                      {contact.autoConversation && (
                        <View style={styles.autoBadge}>
                          <Text style={styles.autoBadgeText}>AUTO</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => testPersonalizedResponse(contact)}
                    >
                      <MaterialCommunityIcons name="test-tube" size={16} color="#667eea" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => editContact(contact)}
                    >
                      <MaterialCommunityIcons name="pencil" size={16} color="#667eea" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => deleteContact(contact.id)}
                    >
                      <MaterialCommunityIcons name="delete" size={16} color="#ff6b6b" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {contact.theirPosition && (
                  <Text style={styles.contactPosition}>📋 {contact.theirPosition}</Text>
                )}
                
                {contact.customInstructions && (
                  <Text style={styles.contactInstructions}>
                    💡 {contact.customInstructions}
                  </Text>
                )}
                
                <TouchableOpacity 
                  style={[styles.autoToggle, contact.autoConversation && styles.autoToggleActive]}
                  onPress={() => toggleAutoConversation(contact.id)}
                >
                  <Text style={[styles.autoToggleText, contact.autoConversation && styles.autoToggleTextActive]}>
                    {contact.autoConversation ? '🤖 Auto-Conversation ON' : '⏳ Manual Approval Required'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Quick Add Buttons */}
        <View style={styles.quickAddSection}>
          <Text style={styles.sectionTitle}>⚡ Quick Add</Text>
          <View style={styles.quickAddButtons}>
            {roleOptions.slice(1, 5).map((role) => (
              <TouchableOpacity
                key={role.value}
                style={styles.quickAddButton}
                onPress={() => {
                  setContactForm({ ...contactForm, role: role.value });
                  setShowAddContact(true);
                }}
              >
                <Text style={styles.quickAddButtonText}>{role.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Contact Modal */}
      <Modal visible={showAddContact} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingContact ? 'Edit Contact' : 'Add Contact'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Phone number or email"
              value={contactForm.number}
              onChangeText={(text) => setContactForm({...contactForm, number: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Contact name"
              value={contactForm.name}
              onChangeText={(text) => setContactForm({...contactForm, name: text})}
            />
            
            <Text style={styles.inputLabel}>Role/Relationship:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleSelector}>
              {roleOptions.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleOption,
                    contactForm.role === role.value && styles.roleOptionSelected
                  ]}
                  onPress={() => setContactForm({...contactForm, role: role.value})}
                >
                  <Text style={[
                    styles.roleOptionText,
                    contactForm.role === role.value && styles.roleOptionTextSelected
                  ]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TextInput
              style={styles.input}
              placeholder="Their position/title (optional)"
              value={contactForm.theirPosition}
              onChangeText={(text) => setContactForm({...contactForm, theirPosition: text})}
            />
            
            <TextInput
              style={styles.textArea}
              placeholder="Custom instructions for AI (e.g., 'Always mention my React experience')"
              multiline
              numberOfLines={3}
              value={contactForm.customInstructions}
              onChangeText={(text) => setContactForm({...contactForm, customInstructions: text})}
            />
            
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setContactForm({...contactForm, autoConversation: !contactForm.autoConversation})}
            >
              <MaterialCommunityIcons 
                name={contactForm.autoConversation ? "checkbox-marked" : "checkbox-blank-outline"} 
                size={24} 
                color="#667eea" 
              />
              <Text style={styles.checkboxText}>Enable auto-conversation (no approval needed)</Text>
            </TouchableOpacity>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddContact(false);
                  setEditingContact(null);
                  setContactForm({
                    number: '',
                    name: '',
                    role: 'general',
                    theirPosition: '',
                    customInstructions: '',
                    autoConversation: false
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={addOrUpdateContact}
              >
                <Text style={styles.saveButtonText}>
                  {editingContact ? 'Update' : 'Add'} Contact
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getRoleColor = (role) => {
  const colors = {
    hr: '#e3f2fd',
    client: '#fff3e0',
    manager: '#f3e5f5',
    recruiter: '#e8f5e8',
    friend: '#fff8e1',
    family: '#fce4ec'
  };
  return colors[role] || '#f5f5f5';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  resumeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  saveResumeButton: {
    backgroundColor: '#667eea',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  saveResumeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contactNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  contactMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  autoBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  autoBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  contactPosition: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  contactInstructions: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    fontStyle: 'italic',
  },
  autoToggle: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    alignItems: 'center',
  },
  autoToggleActive: {
    backgroundColor: '#e8f5e8',
  },
  autoToggleText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  autoToggleTextActive: {
    color: '#4caf50',
  },
  quickAddSection: {
    marginTop: 20,
  },
  quickAddButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAddButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  quickAddButtonText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  roleSelector: {
    marginBottom: 12,
  },
  roleOption: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  roleOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  roleOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  roleOptionTextSelected: {
    color: 'white',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
