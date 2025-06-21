import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AuthProvider } from "@/context/AuthContext";
import { LogBox } from 'react-native';

// Disable error overlay in development
if (__DEV__) {
  LogBox.ignoreAllLogs();
}

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <AppNavigator />
      {/* <StatusBar style="auto" /> */}
      </AuthProvider>
    </PaperProvider>
  );
}
