import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, SafeAreaView } from "react-native";
import { Text, Button } from "react-native-paper";

import HomeScreen from "../screens/Home";
import SettingsScreen from "../screens/Settings";
import WelcomeScreen from "../screens/Welcome";
import DashboardScreen from "../screens/Dashboard";
import Login from "../screens/Login";
import HistoryScreen from "@/screens/History";
import GenerateCertificate from "@/screens/GenerateCertificate";
import {
  RootStackParamList,
  MainTabParamList,
  HomeStackParamList,
  HistoryStackParamList,
  SettingsStackParamList,
  AuthStackParamList,
  DashboardStackParamList,
} from "../types/navigation";
import BottomNavbar from "../components/BottomNavbar";
import { useAuth } from "@/context/AuthContext";
import RequestDetails from "@/screens/RequestDetails";
import TemplateSettings from "@/screens/TemplateSettings";

// Placeholder components for missing screens
const CertificateDetailsScreen = () => null;

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={Login} />
  </AuthStack.Navigator>
);

const HomeNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
    <HomeStack.Screen name="GenerateCertificate" component={GenerateCertificate} options={
      {
        title: "Genereaza Adeverinta",
        headerShown: true,
      }
    }/>
    <HomeStack.Screen
      name="CertificateDetails"
      component={CertificateDetailsScreen}
    />
  </HomeStack.Navigator>
);

const HistoryNavigator = () => (
  <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
    <HistoryStack.Screen name="HistoryScreen" component={HistoryScreen} />
    <HistoryStack.Screen
      name="RequestDetails"
      component={RequestDetails}
      options={{
        title: "Detalii Cerere",
        headerShown: true,
      }}
    />
    <HistoryStack.Screen
      name="CertificateDetails"
      component={CertificateDetailsScreen}
    />
  </HistoryStack.Navigator>
);

const SettingsNavigator = () => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="SettingsScreen" component={SettingsScreen} />
    <SettingsStack.Screen 
      name="TemplateSettings" 
      component={TemplateSettings}
      options={{ 
        title: "Certificate Templates",
        headerShown: true 
      }}
    />
  </SettingsStack.Navigator>
);

const DashboardNavigator = () => (
  <DashboardStack.Navigator>
    <DashboardStack.Screen name="DashboardScreen" component={DashboardScreen} options={{
      title: "Dashboard",
    }}/>
    <DashboardStack.Screen
      name="RequestDetails"
      component={RequestDetails}
      options={({ navigation }) => ({
        title: "Request Details",
        headerBackTitleVisible: true, // hides the back button label if you want
        headerLeft: () => (
          <Button
            onPress={() => navigation.goBack()}
            compact
            mode="text"
            style={{ marginLeft: 10 }}
          >
            Back
          </Button>
        ),
      })}
    />
  </DashboardStack.Navigator>
);

const MainAppNavigator = ({ isAdmin }: { isAdmin: boolean }) => (
  <Tab.Navigator
    tabBar={(props) => <BottomNavbar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen
      name="Home"
      component={HomeNavigator}
      options={{ title: "Home" }}
    />
    <Tab.Screen
      name="History"
      component={HistoryNavigator}
      options={{ title: "History" }}
    />
    {isAdmin && (
      <Tab.Screen
        name="Dashboard"
        component={DashboardNavigator}
        options={{ title: "Dashboard" }}
      />
    )}
    <Tab.Screen
      name="Settings"
      component={SettingsNavigator}
      options={{ title: "Settings" }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <RootStack.Screen name="MainApp">
            {() => <MainAppNavigator isAdmin={isAdmin} />}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
