import React, { useEffect, useState } from "react";
import { SafeAreaView, Alert } from "react-native";
import { Text, Button } from "react-native-paper";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { firebaseAuth } from "../config/firebase";
import * as AuthSession from "expo-auth-session";

// Complete the auth session if necessary (for Expo)
WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:
      "83721212301-tqb83qs6ipe0th29e4mf798ckngidv5f.apps.googleusercontent.com", // Replace with your Web client ID
    redirectUri: redirectUri, // Dynamically generated redirect URI
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(firebaseAuth, credential)
        .then(() => {
          setIsAuthenticated(true);
        })
        .catch((error: any) => {
          Alert.alert("Login Error", error.message || "Failed to sign in with Google");
        });
    }
  }, [response]);

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text variant="headlineMedium">Login with Google</Text>
      <Button
        mode="contained"
        onPress={() => promptAsync()} // Start the Google sign-in process
        style={{ marginTop: 20, width: "50%" }}
        disabled={!request} // Disable the button until the request is ready
      >
        Continue with Google
      </Button>
    </SafeAreaView>
  );
};

export default Login;
