import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Button, ActivityIndicator } from "react-native-paper";

interface FormData {
  numeComplet: string;
  cnp: string;
  facultatea: string;
  specializarea: string;
  anulDeStudiu: string;
  formaInvatamant: string;
  finantare: string;
  statut: string;
  tipAdeverinta: string;
  altMotiv: string;
}

interface CertificateRequestButtonProps {
  formData?: FormData;
  onSuccess?: () => void;
}

export default function CertificateRequestButton({ 
  formData, 
  onSuccess 
}: CertificateRequestButtonProps) {
  const auth = getAuth();
  const db = getFirestore();
  const [loading, setLoading] = useState(false);

  const validateFormData = () => {
    if (!formData) return false;
    
    const requiredFields = [
      'numeComplet',
      'cnp', 
      'facultatea',
      'specializarea',
      'anulDeStudiu',
      'formaInvatamant',
      'finantare',
      'statut',
      'tipAdeverinta'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof FormData] || formData[field as keyof FormData].trim() === '') {
        return false;
      }
    }

    // Special validation for "alt_motiv"
    if (formData.tipAdeverinta === 'alt_motiv' && (!formData.altMotiv || formData.altMotiv.trim() === '')) {
      return false;
    }

    return true;
  };

  const submitRequest = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    if (!validateFormData()) {
      Alert.alert("Error", "Te rugăm să completezi toate câmpurile obligatorii");
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        // User info
        userId: user.uid,
        email: user.email,
        name: user.displayName,
        
        // Form data
        numeComplet: formData!.numeComplet,
        cnp: formData!.cnp,
        facultatea: formData!.facultatea,
        specializarea: formData!.specializarea,
        anulDeStudiu: formData!.anulDeStudiu,
        formaInvatamant: formData!.formaInvatamant,
        finantare: formData!.finantare,
        studentStatus: formData!.statut,
        type: formData!.tipAdeverinta,
        ...(formData!.tipAdeverinta === 'alt_motiv' && { altMotiv: formData!.altMotiv }),
        
        // Request metadata
        status: "pending",
        timestamp: serverTimestamp(),
        requestType: "certificate"
      };

      // Add the request to the requests collection
      const docRef = await addDoc(collection(db, "requests"), requestData);
      
      // Update the user's request count
      const userDocRef = doc(db, "users", user.uid);
      
      // Check if user document exists first
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        // If user document exists, increment the pending count
        await updateDoc(userDocRef, {
          "requestCounts.pending": increment(1)
        });
      } else {
        // If user document doesn't exist, create it with initial values
        await setDoc(userDocRef, {
          requestCounts: {
            pending: 1,
            signed: 0,
            rejected: 0
          },
          userId: user.uid,
          email: user.email,
          displayName: user.displayName,
          createdAt: serverTimestamp()
        });
      }
      
      Alert.alert(
        "Succes", 
        "Cererea pentru adeverință a fost trimisă cu succes!",
        [
          {
            text: "OK",
            onPress: () => {
              if (onSuccess) {
                onSuccess();
              }
            }
          }
        ]
      );
      
      console.log("Document written with ID: ", docRef.id);
      console.log("User request count updated for user: ", user.uid);
    } catch (error) {
      Alert.alert("Error", "Nu s-a putut trimite cererea. Te rugăm să încerci din nou.");
      console.error("Error adding document: ", error);
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = !formData || !validateFormData() || loading;

  return (
    <View style={styles.buttonContainer}>
      <Button 
        mode="contained" 
        onPress={submitRequest}
        disabled={isButtonDisabled}
        style={[styles.button, loading && styles.loadingButton]}
        loading={loading}
      >
        {loading ? "Se trimite..." : "Trimite Cererea"}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  loadingButton: {
    opacity: 0.8,
  },
});
