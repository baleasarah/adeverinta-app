import React, { useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { Button } from "react-native-paper";
import { doc, updateDoc, getFirestore, getDoc, increment, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

type Props = {
  requestId: string;
  studentName: string;
  onSignedSuccess?: () => void;
};

export default function SignCertificateButton({ requestId, studentName, onSignedSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const db = getFirestore();

  const handleSignCertificate = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get the selected template
      const settingsRef = doc(db, 'settings', 'templates');
      const settingsDoc = await getDoc(settingsRef);
      const templatePath = settingsDoc.exists() ? settingsDoc.data().selectedTemplate : null;

      // Get the request document
      const requestRef = doc(db, "requests", requestId);
      const requestDoc = await getDoc(requestRef);
      if (!requestDoc.exists()) {
        throw new Error("Request not found");
      }

      const requestData = requestDoc.data();
      const userId = requestData.userId;

      // Get user data for the request
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        throw new Error("User not found");
      }
      const userData = userDoc.data();

      const formattedDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const response = await fetch('https://sign-certificate-service-173171564380.europe-west1.run.app/signCertificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: studentName,
          "Nume Student": userData.name || "",
          "CNP Student": userData.cnp || "",
          "Anul": userData.studyYear || "",
          "Facultatea": userData.faculty || "",
          "Specializarea": userData.specialization || "",
          "Motiv": requestData.type || "",
          "Data": formattedDate,
          templatePath: `templates/${templatePath}` || "/templates/adeverinta_template.docx"
        }),
      });

      if (!response.ok) {
        console.log(templatePath);
        const errorData = await response.json();
        console.log('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to sign certificate');
      }

      const result = await response.json();
      const { message, url } = result;

      // Update the request document with the signed document URL
      await updateDoc(requestRef, {
        status: "signed",
        signedDocumentUrl: url,
        signedAt: serverTimestamp(),
        signedBy: studentName
      });

      // Update user's request counts: decrement pending, increment signed
      const userDocRef = doc(db, "users", userId);
      const currentCounts = userData.requestCounts || { pending: 0, signed: 0, rejected: 0 };

      await updateDoc(userDocRef, {
        requestCounts: {
          pending: currentCounts.pending - 1,
          signed: currentCounts.signed + 1,
          rejected: currentCounts.rejected // Preserve the existing rejected count
        }
      });

      Alert.alert(
        "Success", 
        `Certificate signed successfully!\nDocument saved and status updated.`,
        [
          {
            text: "OK",
            onPress: () => {
              onSignedSuccess?.();
            }
          }
        ]
      );
      console.log("Signed document URL:", url);
    } catch (error: any) {
      console.error("Error signing certificate:", error);
      Alert.alert("Error", error.message || "Failed to sign certificate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ marginVertical: 10 }}>
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <Button mode="contained" onPress={handleSignCertificate}>
          Sign Certificate
        </Button>
      )}
    </View>
  );
}
