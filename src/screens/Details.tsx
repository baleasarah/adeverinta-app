import React, { useState } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import { Text, Button, Modal, Portal } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<HomeStackParamList, "CertificateDetails">;

const CertificateDetails = ({ navigation, route }: Props) => {
  const { certificateId } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineMedium">Certificate Details</Text>
      <Text>Certificate ID: {certificateId}</Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate("HomeScreen")}
        style={styles.button}
      >
        Back to Home
      </Button>
      <Button
        mode="contained"
        onPress={() => setModalVisible(true)}
        style={styles.button}
      >
        Show More Details
      </Button>
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20 }}>
          <Text variant="titleMedium">Full Certificate Details</Text>
          <Text>All the details about certificate {certificateId}...</Text>
          <Button mode="contained" onPress={() => setModalVisible(false)} style={{ marginTop: 10 }}>
            Close
          </Button>
        </Modal>
      </Portal>
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
  button: {
    marginTop: 20,
  },
});

export default CertificateDetails;
