import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';

import { ApiConfig, UserPreferences, InferenceResult, Recipe } from './types';
import { getRecipesFromImage } from './lib/api';
import { 
  saveApiConfig, 
  getApiConfig, 
  saveUserPreferences, 
  getUserPreferences,
  saveLastResult,
  getLastResult,
  clearLastResult
} from './lib/storage';
import { 
  requestPermissions, 
  pickImageFromGallery, 
  takePhotoWithCamera,
  compressImage 
} from './lib/imageUtils';
import { copyRecipeToClipboard, copyShoppingListToClipboard } from './lib/clipboardUtils';

export default function App() {
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    dietaryPreferences: [],
    dislikes: [],
    availableTools: [],
  });
  const [showApiModal, setShowApiModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API Modal state
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempBaseUrl, setTempBaseUrl] = useState('https://api.openai.com/v1');
  const [tempModel, setTempModel] = useState('gpt-4o-mini');

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    const [config, preferences, lastResult] = await Promise.all([
      getApiConfig(),
      getUserPreferences(),
      getLastResult(),
    ]);

    if (config) {
      setApiConfig(config);
    } else {
      setShowApiModal(true);
    }

    if (preferences) {
      setUserPreferences(preferences);
    }

    if (lastResult) {
      setResult(lastResult);
    }
  };

  const saveApiConfigAndClose = async () => {
    console.log('Save button pressed!'); // Debug log
    if (!tempApiKey.trim()) {
      Alert.alert('Error', 'API Key is required');
      return;
    }

    const config: ApiConfig = {
      apiKey: tempApiKey.trim(),
      baseUrl: tempBaseUrl.trim(),
      model: tempModel.trim(),
    };

    await saveApiConfig(config);
    setApiConfig(config);
    setShowApiModal(false);
    setTempApiKey('');
  };

  const handleImageSelection = async (source: 'gallery' | 'camera') => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      Alert.alert('Permission Required', 'Camera and photo library permissions are required to use this app.');
      return;
    }

    let base64Image: string | null = null;
    
    if (source === 'gallery') {
      base64Image = await pickImageFromGallery();
    } else {
      base64Image = await takePhotoWithCamera();
    }

    if (base64Image) {
      const compressedImage = await compressImage(base64Image);
      setSelectedImage(compressedImage);
      setError(null);
    }
  };

  const getRecipes = async () => {
    if (!selectedImage || !apiConfig) {
      Alert.alert('Error', 'Please select an image and configure your API key first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const recipes = await getRecipesFromImage(selectedImage, apiConfig, userPreferences);
      setResult(recipes);
      await saveLastResult(recipes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error getting recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRecipe = async (recipe: Recipe) => {
    try {
      await copyRecipeToClipboard(recipe);
      Alert.alert('Success', 'Recipe copied to clipboard!');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy recipe to clipboard');
    }
  };

  const handleCopyShoppingList = async () => {
    if (!result) return;
    
    const allMissingItems = result.recipes.flatMap((recipe: Recipe) => recipe.missing_items);
    const uniqueMissingItems = [...new Set(allMissingItems)];
    
    try {
      await copyShoppingListToClipboard(uniqueMissingItems);
      Alert.alert('Success', 'Shopping list copied to clipboard!');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy shopping list to clipboard');
    }
  };

  const clearResults = async () => {
    setResult(null);
    setSelectedImage(null);
    setError(null);
    await clearLastResult();
  };

  const updatePreferences = async (field: keyof UserPreferences, value: string[]) => {
    const newPreferences = { ...userPreferences, [field]: value };
    setUserPreferences(newPreferences);
    await saveUserPreferences(newPreferences);
  };

  const parseCommaSeparated = (text: string): string[] => {
    return text.split(',').map(item => item.trim()).filter(item => item.length > 0);
  };

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return styles.difficultyEasy;
      case 'medium':
        return styles.difficultyMedium;
      case 'hard':
        return styles.difficultyHard;
      default:
        return {};
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fridge Recipes (BYOK)</Text>
        <TouchableOpacity 
          style={styles.keyButton} 
          onPress={() => setShowApiModal(true)}
        >
          <Text style={styles.keyButtonText}>🔑 Key</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <Text style={styles.label}>Dietary Preferences (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={userPreferences.dietaryPreferences.join(', ')}
            onChangeText={(text) => updatePreferences('dietaryPreferences', parseCommaSeparated(text))}
            placeholder="e.g., vegetarian, gluten-free"
            multiline
          />

          <Text style={styles.label}>Dislikes (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={userPreferences.dislikes.join(', ')}
            onChangeText={(text) => updatePreferences('dislikes', parseCommaSeparated(text))}
            placeholder="e.g., mushrooms, cilantro"
            multiline
          />

          <Text style={styles.label}>Available Tools (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={userPreferences.availableTools.join(', ')}
            onChangeText={(text) => updatePreferences('availableTools', parseCommaSeparated(text))}
            placeholder="e.g., oven, air fryer, microwave"
            multiline
          />
        </View>

        {/* Image Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Photo</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => handleImageSelection('gallery')}
            >
              <Text style={styles.buttonText}>Pick Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => handleImageSelection('camera')}
            >
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          {selectedImage && (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: `data:image/jpeg;base64,${selectedImage}` }} 
                style={styles.selectedImage} 
                resizeMode="contain"
              />
            </View>
          )}

          {selectedImage && (
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={getRecipes}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>Get Recipes</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={getRecipes}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results */}
        {result && (
          <View style={styles.section}>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>Recipes</Text>
              <View style={styles.resultsActions}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleCopyShoppingList}
                >
                  <Text style={styles.actionButtonText}>Copy Shopping List</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={clearResults}
                >
                  <Text style={styles.actionButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Detected Items */}
            <Text style={styles.subsectionTitle}>Detected Items</Text>
            <View style={styles.pillContainer}>
              {result.detected_items.map((item, index) => (
                <View key={index} style={styles.pill}>
                  <Text style={styles.pillText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Recipe Cards */}
            {result.recipes.map((recipe, index) => (
              <View key={index} style={styles.recipeCard}>
                <View style={styles.recipeHeader}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <View style={styles.recipeMeta}>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>{recipe.estimated_time_min}m</Text>
                    </View>
                    <View style={[styles.metaChip, getDifficultyStyle(recipe.difficulty)]}>
                      <Text style={styles.metaChipText}>{recipe.difficulty}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.recipeSection}>
                  <Text style={styles.recipeSectionTitle}>Ingredients Used</Text>
                  {recipe.ingredients_used.map((ingredient, idx) => (
                    <Text key={idx} style={styles.recipeText}>• {ingredient}</Text>
                  ))}
                </View>

                {recipe.missing_items.length > 0 && (
                  <View style={styles.recipeSection}>
                    <Text style={styles.recipeSectionTitle}>Missing Items</Text>
                    {recipe.missing_items.map((item, idx) => (
                      <Text key={idx} style={styles.recipeText}>• {item}</Text>
                    ))}
                  </View>
                )}

                <View style={styles.recipeSection}>
                  <Text style={styles.recipeSectionTitle}>Instructions</Text>
                  {recipe.steps.map((step, idx) => (
                    <Text key={idx} style={styles.recipeText}>{idx + 1}. {step}</Text>
                  ))}
                </View>

                {recipe.notes && (
                  <View style={styles.recipeSection}>
                    <Text style={styles.recipeSectionTitle}>Notes</Text>
                    <Text style={styles.recipeText}>{recipe.notes}</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.copyButton} 
                  onPress={() => handleCopyRecipe(recipe)}
                >
                  <Text style={styles.copyButtonText}>Copy Recipe</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* API Configuration Modal */}
      <Modal
        visible={showApiModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>API Configuration</Text>
            <TouchableOpacity onPress={() => setShowApiModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>API Key *</Text>
            <TextInput
              style={styles.input}
              value={tempApiKey}
              onChangeText={setTempApiKey}
              placeholder="Enter your OpenAI API key"
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.label}>Base URL</Text>
            <TextInput
              style={styles.input}
              value={tempBaseUrl}
              onChangeText={setTempBaseUrl}
              placeholder="https://api.openai.com/v1"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Model</Text>
            <TextInput
              style={styles.input}
              value={tempModel}
              onChangeText={setTempModel}
              placeholder="gpt-4o-mini"
              autoCapitalize="none"
            />

            <TouchableOpacity 
              style={{
                backgroundColor: '#007AFF',
                paddingVertical: 15,
                paddingHorizontal: 20,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={saveApiConfigAndClose}
            >
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 18,
                textAlign: 'center',
              }}>
                Save Configuration
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  keyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  keyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    minHeight: 44,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  selectedImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 16,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#555',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  pill: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
  },
  recipeCard: {
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaChip: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  difficultyEasy: {
    backgroundColor: '#c8e6c9',
  },
  difficultyMedium: {
    backgroundColor: '#fff3e0',
  },
  difficultyHard: {
    backgroundColor: '#ffcdd2',
  },
  recipeSection: {
    marginBottom: 16,
  },
  recipeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  recipeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  copyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  copyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
}); 