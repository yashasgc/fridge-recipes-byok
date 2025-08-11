import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiConfig, UserPreferences, InferenceResult } from '../types';

const API_CONFIG_KEY = 'fridge_recipes_api_config';
const USER_PREFERENCES_KEY = 'fridge_recipes_user_preferences';
const LAST_RESULT_KEY = 'fridge_recipes_last_result';

export async function saveApiConfig(config: ApiConfig): Promise<void> {
  await SecureStore.setItemAsync(API_CONFIG_KEY, JSON.stringify(config));
}

export async function getApiConfig(): Promise<ApiConfig | null> {
  try {
    const configString = await SecureStore.getItemAsync(API_CONFIG_KEY);
    if (configString) {
      return JSON.parse(configString);
    }
  } catch (error) {
    console.error('Error reading API config:', error);
  }
  return null;
}

export async function saveUserPreferences(preferences: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
}

export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const preferencesString = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
    if (preferencesString) {
      return JSON.parse(preferencesString);
    }
  } catch (error) {
    console.error('Error reading user preferences:', error);
  }
  
  // Return default preferences
  return {
    dietaryPreferences: [],
    dislikes: [],
    availableTools: [],
  };
}

export async function saveLastResult(result: InferenceResult): Promise<void> {
  await AsyncStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));
}

export async function getLastResult(): Promise<InferenceResult | null> {
  try {
    const resultString = await AsyncStorage.getItem(LAST_RESULT_KEY);
    if (resultString) {
      return JSON.parse(resultString);
    }
  } catch (error) {
    console.error('Error reading last result:', error);
  }
  return null;
}

export async function clearLastResult(): Promise<void> {
  await AsyncStorage.removeItem(LAST_RESULT_KEY);
} 