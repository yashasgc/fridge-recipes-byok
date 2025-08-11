import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export async function requestPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    return cameraStatus.status === 'granted';
  }
  return true;
}

export async function pickImageFromGallery(): Promise<string | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].base64 || null;
    }
    return null;
  } catch (error) {
    console.error('Error picking image from gallery:', error);
    return null;
  }
}

export async function takePhotoWithCamera(): Promise<string | null> {
  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].base64 || null;
    }
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
}

export async function compressImage(base64Image: string): Promise<string> {
  try {
    // Convert base64 to URI
    const uri = `data:image/jpeg;base64,${base64Image}`;
    
    // Compress the image
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    return result.base64 || base64Image;
  } catch (error) {
    console.error('Error compressing image:', error);
    return base64Image;
  }
} 