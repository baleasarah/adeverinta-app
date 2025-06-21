import React from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import { Text, Button } from "react-native-paper";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

const Welcome = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  return (
    <SafeAreaView style={styles.container}>
      <Text variant="displayMedium" style={styles.title}>
        Welcome!
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Start your journey with us
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.replace("Auth")}
        style={styles.button}
      >
        Get Started
      </Button>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    marginBottom: 20,
  },
  subtitle: {
    marginBottom: 40,
  },
  button: {
    paddingHorizontal: 20,
  },
});

export default Welcome;
