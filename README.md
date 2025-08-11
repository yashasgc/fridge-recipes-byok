# 🍳 Fridge Recipes (BYOK)

> **Free & Open Source** - A React Native Expo app that generates recipe suggestions from photos of your fridge or pantry using your own LLM API key.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-blue.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> ⭐ **Star this repo if you find it helpful!** ⭐

**Turn your fridge contents into delicious recipes with AI!** 🎯

## Features

- **BYOK (Bring Your Own Key)**: Use your own OpenAI-compatible API key
- **Photo Analysis**: Take photos or select from gallery to analyze ingredients
- **Smart Recipe Generation**: Get 3-5 recipe suggestions based on detected ingredients
- **Dietary Preferences**: Set vegetarian, vegan, gluten-free, and other dietary restrictions
- **Kitchen Tools**: Specify available cooking equipment (oven, air fryer, microwave, etc.)
- **Recipe Details**: Each recipe includes ingredients used, missing items, step-by-step instructions, time estimates, and difficulty levels
- **Copy to Clipboard**: Copy individual recipes or shopping lists in Markdown format
- **Local Storage**: Securely store API keys and cache last results
- **No Backend**: Everything runs locally on your device

## Tech Stack

- **Platform**: React Native via Expo (latest)
- **Language**: TypeScript
- **Storage**: expo-secure-store (API keys), AsyncStorage (preferences & cache)
- **Image Handling**: expo-image-picker (camera + gallery), expo-image-manipulator (compression)
- **Clipboard**: expo-clipboard
- **UI**: Native React Native components with custom styling

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/fridge-recipes-byok.git
cd fridge-recipes-byok

# Install dependencies
npm install

# Start the development server
npm start

# Run on your preferred platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web Browser
```

## 📱 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g @expo/cli`)
- [Expo Go](https://expo.dev/client) app on your mobile device (for testing)

### Local Development
1. **Clone & Install**: Follow the Quick Start commands above
2. **Start Expo**: `npm start` launches the Metro bundler
3. **Test on Device**: Scan QR code with Expo Go app
4. **Test on Simulator**: Press `i` for iOS or `a` for Android

## Setup

### 1. API Configuration
On first launch, the app will prompt you to enter:
- **API Key**: Your OpenAI or OpenAI-compatible API key
- **Base URL**: API endpoint (default: `https://api.openai.com/v1`)
- **Model**: AI model to use (default: `gpt-4o-mini`)

### 2. Permissions
The app will request:
- Camera access for taking photos
- Photo library access for selecting images

### 3. Preferences
Set your:
- Dietary preferences (vegetarian, vegan, gluten-free, etc.)
- Food dislikes
- Available kitchen tools

## Usage

1. **Configure API Key**: Tap the "Key" button in the header to set your API key
2. **Set Preferences**: Enter your dietary restrictions and available tools
3. **Take/Select Photo**: Use camera or gallery to capture your fridge/pantry
4. **Get Recipes**: Tap "Get Recipes" to analyze the image and generate suggestions
5. **View Results**: Browse detected ingredients and recipe suggestions
6. **Copy Recipes**: Use the "Copy Recipe" button to copy individual recipes to clipboard
7. **Shopping List**: Use "Copy Shopping List" to get all missing ingredients

## API Requirements

The app works with any OpenAI-compatible API that supports:
- Vision models (GPT-4V, Claude, etc.)
- Chat completions endpoint: `/chat/completions`
- Base64 image input via `image_url` content type
- JSON response format

### Example API Call
```typescript
POST /chat/completions
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "prompt..." },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } }
      ]
    }
  ],
  "response_format": { "type": "json_object" },
  "temperature": 0.5
}
```

## Security & Privacy

- **API Keys**: Stored securely using expo-secure-store (encrypted storage)
- **Images**: Sent only to your configured LLM provider
- **No Analytics**: No remote logging or analytics
- **Local Storage**: All data stays on your device
- **No Backend**: No server-side processing or data collection

## Project Structure

```
FridgeRecipeMaker/
├── App.tsx                 # Main app component
├── types.ts               # TypeScript type definitions
├── lib/
│   ├── api.ts            # API call functions
│   ├── storage.ts        # Secure storage utilities
│   ├── imageUtils.ts     # Image handling functions
│   └── clipboardUtils.ts # Clipboard operations
├── assets/               # App assets
└── package.json          # Dependencies
```

## Dependencies

- `expo`: React Native framework
- `expo-image-picker`: Camera and gallery access
- `expo-secure-store`: Secure API key storage
- `expo-clipboard`: Clipboard operations
- `expo-image-manipulator`: Image compression
- `@react-native-async-storage/async-storage`: Local data storage

## Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure your API key is valid and has sufficient credits
2. **Permission Denied**: Grant camera and photo library permissions in device settings
3. **Image Processing**: Large images are automatically compressed for better performance
4. **Network Errors**: Check your internet connection and API endpoint configuration

### Development

- **TypeScript Errors**: Run `npx tsc --noEmit` to check for type errors
- **Metro Bundler**: Use `npm start --reset-cache` if you encounter bundling issues
- **Device Testing**: Test on both iOS and Android for best compatibility

## 🤝 Contributing

We welcome contributions! This is a free, open-source project.

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Test on both iOS and Android
- Update documentation for new features
- Keep the UI clean and minimal

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**What this means:**
- ✅ **Free to use** - No cost, no restrictions
- ✅ **Open source** - View, modify, and distribute the code
- ✅ **Commercial use** - Use in commercial projects
- ✅ **Attribution** - Just include the license and copyright notice

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the Expo documentation
3. Open an issue in the repository

---

**Note**: This app requires an active API key from an OpenAI-compatible service. You are responsible for managing your own API usage and costs.
