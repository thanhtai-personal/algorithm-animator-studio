import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-3xl font-bold mb-4">
        Clothe Rental Management
      </Text>
      <Text className="text-lg text-gray-600 mb-2">
        A modern mobile application
      </Text>
      <Text className="text-sm text-gray-500">
        Built with React Native and Expo
      </Text>
    </View>
  );
}
