import { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
  Auth: undefined;
  MainApp: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: NavigatorScreenParams<HistoryStackParamList>;
  Settings: undefined;
  Dashboard: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  GenerateCertificate: undefined;
  CertificateDetails: { certificateId: string };
};

export type HistoryStackParamList = {
  HistoryScreen: { filter?: 'pending' | 'rejected' | 'signed' } | undefined;
  RequestDetails: { requestId: string };
  CertificateDetails: { certificateId: string };
};

export type SettingsStackParamList = {
  SettingsScreen: undefined;
  TemplateSettings: undefined;
};

export type DashboardStackParamList = {
  DashboardScreen: undefined;
  RequestDetails: { requestId: string };
};