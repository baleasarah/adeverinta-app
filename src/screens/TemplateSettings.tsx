import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, FAB, IconButton } from 'react-native-paper';
import { getStorage, ref, listAll, getDownloadURL, uploadBytes, deleteObject } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import PdfViewer from '@/components/PdfViewer';
import * as DocumentPicker from 'expo-document-picker';

const TemplateSettings = () => {
  const [templates, setTemplates] = useState<{ name: string; url: string; size: number; timeCreated: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { isAdmin, user } = useAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchTemplates();
    loadSelectedTemplate();
  }, []);

  const loadSelectedTemplate = async () => {
    if (!user) return;
    try {
      const settingsRef = doc(db, 'settings', 'templates');
      const settingsDoc = await getDoc(settingsRef);
      if (settingsDoc.exists()) {
        setSelectedTemplate(settingsDoc.data().selectedTemplate);
      }
    } catch (error) {
      console.error('Error loading selected template:', error);
    }
  };

  const saveSelectedTemplate = async (templateName: string) => {
    if (!user) return;
    try {
      const settingsRef = doc(db, 'settings', 'templates');
      await setDoc(settingsRef, {
        selectedTemplate: templateName,
        updatedAt: new Date(),
        updatedBy: user.uid
      });
      setSelectedTemplate(templateName);
    } catch (error) {
      console.error('Error saving selected template:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const storage = getStorage();
      const templatesRef = ref(storage, 'templates');
      console.log('Fetching templates from:', templatesRef.fullPath);
      
      const result = await listAll(templatesRef);
      console.log('Found templates:', result.items.length);
      
      const templatePromises = result.items.map(async (item) => {
        console.log('Processing template:', item.name);
        const url = await getDownloadURL(item);
        return {
          name: item.name,
          url: url,
          size: 0, // We'll get this later if needed
          timeCreated: new Date().toISOString(), // Default value
        };
      });

      const templateList = await Promise.all(templatePromises);
      console.log('Final template list:', templateList);
      setTemplates(templateList);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadTemplate = async () => {
    if (!user || !isAdmin) {
      Alert.alert('Error', 'Only administrators can upload templates.');
      return;
    }

    try {
      // Pick a document
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Validate file type
      if (!file.name.endsWith('.docx')) {
        Alert.alert('Error', 'Please select a .docx file');
        return;
      }

      // Check file size (max 10MB)
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 10MB');
        return;
      }

      // Check if template already exists
      const existingTemplate = templates.find(t => t.name === file.name);
      if (existingTemplate) {
        Alert.alert(
          'Template Exists',
          `A template with the name "${file.name}" already exists. Do you want to replace it?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Replace',
              style: 'destructive',
              onPress: () => uploadFile(file),
            },
          ]
        );
        return;
      }

      await uploadFile(file);
    } catch (error) {
      console.error('Error uploading template:', error);
      Alert.alert('Error', 'Failed to upload template. Please try again.');
    }
  };

  const uploadFile = async (file: any) => {
    setUploading(true);
    try {
      // Upload to Firebase Storage
      const storage = getStorage();
      const templateRef = ref(storage, `templates/${file.name}`);
      
      // Read the file
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      // Upload the file
      await uploadBytes(templateRef, blob);
      
      Alert.alert('Success', 'Template uploaded successfully!');
      
      // Refresh the templates list
      await fetchTemplates();
    } catch (error) {
      console.error('Error uploading template:', error);
      Alert.alert('Error', 'Failed to upload template. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteTemplate = async (templateName: string) => {
    if (!user || !isAdmin) {
      Alert.alert('Error', 'Only administrators can delete templates.');
      return;
    }
    
    // Show confirmation dialog
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${templateName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storage = getStorage();
              const templatesRef = ref(storage, `templates/${templateName}`);
              await deleteObject(templatesRef);
              
              // If this was the selected template, clear the selection
              if (selectedTemplate === templateName) {
                const settingsRef = doc(db, 'settings', 'templates');
                await setDoc(settingsRef, {
                  selectedTemplate: null,
                  updatedAt: new Date(),
                  updatedBy: user.uid
                });
                setSelectedTemplate(null);
              }
              
              Alert.alert('Success', 'Template deleted successfully!');
              await fetchTemplates();
            } catch (error: any) {
              console.error('Error deleting template:', error);
              
              // Handle specific Firebase Storage errors
              if (error.code === 'storage/unauthorized') {
                Alert.alert(
                  'Permission Error', 
                  'You do not have permission to delete templates from Firebase Storage. This is a security setting that prevents unauthorized deletion. Please contact the administrator or delete templates directly from the Firebase Console.',
                  [
                    {
                      text: 'OK',
                      onPress: () => fetchTemplates() // Refresh the list
                    }
                  ]
                );
              } else if (error.code === 'storage/object-not-found') {
                Alert.alert('Error', 'Template not found. It may have been already deleted.');
              } else {
                Alert.alert('Error', 'Failed to delete template. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text>Access denied. Admin privileges required.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text style={styles.title}>Certificate Templates</Text>
            <Text style={styles.subtitle}>Select a template to use for certificate generation</Text>
            <Text style={styles.infoText}>
              Note: Template deletion requires Firebase Console access due to security settings.
            </Text>
          </Card.Content>
        </Card>

        {templates.map((template) => (
          <Card 
            key={template.name} 
            style={[
              styles.templateCard,
              selectedTemplate === template.name && styles.selectedCard
            ]}
          >
            <Card.Content>
              <View style={styles.templateHeader}>
                <MaterialCommunityIcons name="file-document" size={24} color="#666" />
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateDetails}>
                    Template available
                  </Text>
                </View>
              </View>
              
              <View style={styles.previewContainer}>
                <PdfViewer uri={template.url} />
              </View>

              <Button
                mode={selectedTemplate === template.name ? "contained" : "outlined"}
                onPress={() => saveSelectedTemplate(template.name)}
                style={styles.selectButton}
              >
                {selectedTemplate === template.name ? "Selected" : "Select Template"}
              </Button>

              <IconButton
                icon="delete"
                onPress={() => deleteTemplate(template.name)}
                style={styles.deleteButton}
              />
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <FAB
        icon="upload"
        style={styles.fab}
        onPress={uploadTemplate}
        loading={uploading}
        disabled={uploading}
        label="Upload Template"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  templateCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#4caf50',
    borderWidth: 2,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  templateInfo: {
    marginLeft: 8,
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
  },
  templateDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  previewContainer: {
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectButton: {
    marginTop: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default TemplateSettings; 