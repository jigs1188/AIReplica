import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Switch, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../firebase';
import { personalAssistantService } from '../utils/personalAssistantService';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ContactAuthorizationScreen() {
  const router = useRouter();
  const [authorizedContacts, setAuthorizedContacts] = useState([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // New contact form
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    enabledPlatforms: ['whatsapp'],
    preferredStyle: 'Professional',
    customInstructions: '',
    responseDelay: 0,
    maxResponseLength: 200,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    includeSignature: false
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    loadAuthorizedContacts();
  }, []);

  const loadAuthorizedContacts = async () => {
    try {
      setIsLoading(true);
      await personalAssistantService.initialize();
      const contacts = personalAssistantService.getAuthorizedContacts();
      setAuthorizedContacts(contacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load authorized contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async () => {
    try {
      if (!newContact.name.trim()) {
        Alert.alert('Validation Error', 'Contact name is required');
        return;
      }

      if (!newContact.phone.trim() && !newContact.email.trim()) {
        Alert.alert('Validation Error', 'Either phone number or email is required');
        return;
      }

      // Generate unique contact ID
      const contactId = newContact.phone || newContact.email || `${newContact.name}_${Date.now()}`;

      const result = await personalAssistantService.authorizeContact({
        ...newContact,
        contactId
      });

      if (result.success) {
        Alert.alert(
          'Contact Authorized! ✅',
          `${newContact.name} can now receive auto-responses on ${newContact.enabledPlatforms.join(', ')}.`,
          [
            { text: 'Add Another', onPress: () => resetForm() },
            { text: 'Done', onPress: () => {
              setShowAddContact(false);
              resetForm();
              loadAuthorizedContacts();
            }}
          ]
        );
      } else {
        Alert.alert('Authorization Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to authorize contact: ' + error.message);
    }
  };

  const resetForm = () => {
    setNewContact({
      name: '',
      phone: '',
      email: '',
      enabledPlatforms: ['whatsapp'],
      preferredStyle: 'Professional',
      customInstructions: '',
      responseDelay: 0,
      maxResponseLength: 200,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      includeSignature: false
    });
  };

  const handleRevokeAccess = (contact) => {
    Alert.alert(
      'Revoke Access',
      `Remove ${contact.name}'s authorization? They will no longer receive auto-responses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Revoke', style: 'destructive', onPress: async () => {
          const result = await personalAssistantService.revokeContactAccess(contact.id);
          if (result.success) {
            Alert.alert('Access Revoked', `${contact.name} no longer has auto-response access`);
            loadAuthorizedContacts();
          } else {
            Alert.alert('Error', result.error);
          }
        }}
      ]
    );
  };

  const togglePlatform = (platform) => {
    setNewContact(prev => ({
      ...prev,
      enabledPlatforms: prev.enabledPlatforms.includes(platform)
        ? prev.enabledPlatforms.filter(p => p !== platform)
        : [...prev.enabledPlatforms, platform]
    }));
  };

  const ContactCard = ({ contact }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <View style={styles.contactAvatar}>
          <Text style={styles.contactInitial}>
            {contact.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.contactDetails}>
            {contact.phone && `📱 ${contact.phone}`}
            {contact.phone && contact.email && ' • '}
            {contact.email && `✉️ ${contact.email}`}
          </Text>
          <Text style={styles.contactPlatforms}>
            🔗 {contact.enabledPlatforms.join(', ')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.revokeButton}
          onPress={() => handleRevokeAccess(contact)}
        >
          <MaterialCommunityIcons name="close-circle" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.contactMeta}>
        <Text style={styles.metaItem}>Style: {contact.preferredStyle}</Text>
        <Text style={styles.metaItem}>Delay: {contact.responseDelay}s</Text>
        <Text style={styles.metaItem}>
          Expires: {contact.expiresAt && !isNaN(new Date(contact.expiresAt)) ? 
            new Date(contact.expiresAt).toLocaleDateString() : 
            'No expiry set'}
        </Text>
      </View>
      
      {contact.customInstructions && (
        <Text style={styles.customInstructions}>
          📝 {contact.customInstructions}
        </Text>
      )}
    </View>
  );

  const platforms = [
    { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp' },
    { id: 'telegram', name: 'Telegram', icon: 'telegram' },
    { id: 'email', name: 'Email', icon: 'email' },
    { id: 'sms', name: 'SMS', icon: 'message-text' },
    { id: 'slack', name: 'Slack', icon: 'slack' }
  ];

  const responseStyles = ['Professional', 'Casual', 'Friendly', 'Formal', 'Direct'];

  return (
    <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="account-group" size={28} color="#FFFFFF" />
        <Text style={styles.headerText}>Authorized Contacts</Text>
        <TouchableOpacity 
          onPress={() => setShowAddContact(!showAddContact)} 
          style={styles.addButton}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Add Contact Form */}
        {showAddContact && (
          <View style={styles.addContactForm}>
            <View style={styles.formHeader}>
              <MaterialCommunityIcons name="account-plus" size={24} color="#6A0572" />
              <Text style={styles.formTitle}>Authorize New Contact</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Name *</Text>
              <TextInput
                style={styles.input}
                value={newContact.name}
                onChangeText={(text) => setNewContact(prev => ({ ...prev, name: text }))}
                placeholder="Enter contact name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={newContact.phone}
                  onChangeText={(text) => setNewContact(prev => ({ ...prev, phone: text }))}
                  placeholder="+1234567890"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={newContact.email}
                  onChangeText={(text) => setNewContact(prev => ({ ...prev, email: text }))}
                  placeholder="email@example.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Enabled Platforms</Text>
              <View style={styles.platformsGrid}>
                {platforms.map(platform => (
                  <TouchableOpacity
                    key={platform.id}
                    style={[
                      styles.platformButton,
                      newContact.enabledPlatforms.includes(platform.id) && styles.platformButtonActive
                    ]}
                    onPress={() => togglePlatform(platform.id)}
                  >
                    <MaterialCommunityIcons 
                      name={platform.icon} 
                      size={20} 
                      color={newContact.enabledPlatforms.includes(platform.id) ? "#FFFFFF" : "#6A0572"} 
                    />
                    <Text style={[
                      styles.platformButtonText,
                      newContact.enabledPlatforms.includes(platform.id) && styles.platformButtonTextActive
                    ]}>
                      {platform.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Response Style</Text>
                <View style={styles.pickerContainer}>
                  {responseStyles.map(style => (
                    <TouchableOpacity
                      key={style}
                      style={[
                        styles.styleOption,
                        newContact.preferredStyle === style && styles.styleOptionActive
                      ]}
                      onPress={() => setNewContact(prev => ({ ...prev, preferredStyle: style }))}
                    >
                      <Text style={[
                        styles.styleOptionText,
                        newContact.preferredStyle === style && styles.styleOptionTextActive
                      ]}>
                        {style}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Response Delay (seconds)</Text>
                <TextInput
                  style={styles.input}
                  value={newContact.responseDelay.toString()}
                  onChangeText={(text) => setNewContact(prev => ({ 
                    ...prev, 
                    responseDelay: parseInt(text) || 0 
                  }))}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Custom Instructions (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newContact.customInstructions}
                onChangeText={(text) => setNewContact(prev => ({ ...prev, customInstructions: text }))}
                placeholder="Special instructions for responses to this contact..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Include Email Signature</Text>
                <Switch
                  value={newContact.includeSignature}
                  onValueChange={(value) => setNewContact(prev => ({ ...prev, includeSignature: value }))}
                  trackColor={{ false: '#767577', true: '#6A0572' }}
                  thumbColor={newContact.includeSignature ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#6A0572" />
                <Text style={styles.dateButtonText}>
                  Expires: {newContact.expiresAt.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={newContact.expiresAt}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  const currentDate = selectedDate || newContact.expiresAt;
                  setShowDatePicker(Platform.OS === 'android');
                  setNewContact(prev => ({ ...prev, expiresAt: currentDate }));
                }}
                minimumDate={new Date()}
              />
            )}

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddContact(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.authorizeButton}
                onPress={handleAddContact}
              >
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                <Text style={styles.authorizeButtonText}>Authorize Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Authorized Contacts List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Authorized Contacts ({authorizedContacts.length})
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadAuthorizedContacts}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {authorizedContacts.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-off" size={64} color="#E1BEE7" />
              <Text style={styles.emptyTitle}>No Authorized Contacts</Text>
              <Text style={styles.emptySubtitle}>
                Add contacts who can receive auto-responses from your AI assistant
              </Text>
              <TouchableOpacity
                style={styles.addFirstContactButton}
                onPress={() => setShowAddContact(true)}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.addFirstContactText}>Add First Contact</Text>
              </TouchableOpacity>
            </View>
          ) : (
            authorizedContacts.map(contact => (
              <ContactCard key={contact.id} contact={contact} />
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/assistant-personality')}
          >
            <MaterialCommunityIcons name="brain" size={24} color="#6A0572" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Configure Personality</Text>
              <Text style={styles.actionSubtitle}>Set your communication style & instructions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/conversation-history')}
          >
            <MaterialCommunityIcons name="history" size={24} color="#6A0572" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>View Conversation History</Text>
              <Text style={styles.actionSubtitle}>Review all auto-responses & conversations</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/whatsapp-integration')}
          >
            <MaterialCommunityIcons name="whatsapp" size={24} color="#6A0572" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>WhatsApp Integration</Text>
              <Text style={styles.actionSubtitle}>Connect WhatsApp Business API</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            Authorized contacts can receive AI responses on your behalf. 
            The AI uses your personality profile and conversation history to respond naturally.
            {'\n\n'}⚠️ Only authorize trusted contacts who understand they&apos;re communicating with your AI assistant.
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  addContactForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 10,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6A0572',
    backgroundColor: '#FFFFFF',
  },
  platformButtonActive: {
    backgroundColor: '#6A0572',
  },
  platformButtonText: {
    fontSize: 12,
    color: '#6A0572',
    marginLeft: 6,
    fontWeight: '500',
  },
  platformButtonTextActive: {
    color: '#FFFFFF',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  styleOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  styleOptionActive: {
    backgroundColor: '#6A0572',
    borderColor: '#6A0572',
  },
  styleOptionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  styleOptionTextActive: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  authorizeButton: {
    flex: 1,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  authorizeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6A0572',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  contactDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  contactPlatforms: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  revokeButton: {
    padding: 8,
  },
  contactMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  metaItem: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  customInstructions: {
    fontSize: 12,
    color: '#4B5563',
    fontStyle: 'italic',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#E1BEE7',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  addFirstContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addFirstContactText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
