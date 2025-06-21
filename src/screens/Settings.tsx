import React, { useState, useEffect } from "react";
import { StyleSheet, SafeAreaView, ScrollView, View } from "react-native";
import { Text, Button, Modal, Portal, Card, Divider } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SettingsStackParamList } from "../types/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/config/firebase";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<SettingsStackParamList, "SettingsScreen">;

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const { isAdmin, user } = useAuth();
  const navigation = useNavigation<Props["navigation"]>();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut(firebaseAuth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
      setShowLogoutModal(false);
    }
  };

  const renderInfoItem = (icon: string, label: string, value: string | number) => (
    <View style={styles.infoItem}>
      <MaterialCommunityIcons name={icon as any} size={20} color="#666" />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value !== undefined ? value : 'N/A'}</Text>
      </View>
    </View>
  );

  console.log(userData);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {isAdmin && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Admin</Text>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate("TemplateSettings")}
                style={styles.button}
              >
                Certificate Templates
              </Button>
            </Card.Content>
          </Card>
        )}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Account</Text>
            
            {userData && (
              <>
                {renderInfoItem('account', 'Nume', userData.name || '')}
                {renderInfoItem('email', 'Email', userData.email || '')}
                
                {!isAdmin && (
                  <>
                    {renderInfoItem('card-account-details', 'CNP', userData.cnp || '')}
                    {renderInfoItem('school', 'Facultate', userData.faculty || '')}
                    {renderInfoItem('book-education', 'Specializare', userData.specialization || '')}
                    {renderInfoItem('numeric', 'An de studiu', userData.studyYear || '')}
                    
                    <Divider style={styles.divider} />
                    
                    <Text style={styles.statsTitle}>Statistici Cereri</Text>
                    {renderInfoItem('clock-outline', 'În așteptare', userData.requestCounts?.pending || 0)}
                    {renderInfoItem('check-circle', 'Semnate', userData.requestCounts?.signed || 0)}
                    {renderInfoItem('close-circle', 'Respinse', userData.requestCounts?.rejected || 0)}
                  </>
                )}
              </>
            )}

            <Button
              mode="outlined"
              onPress={() => setShowLogoutModal(true)}
              loading={loading}
              style={styles.button}
            >
              Log Out
            </Button>
          </Card.Content>
        </Card>

        <Portal>
          <Modal
            visible={showLogoutModal}
            onDismiss={() => setShowLogoutModal(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Text style={styles.modalText}>
              Are you sure you want to log out?
            </Text>
            <Button
              mode="contained"
              onPress={handleLogout}
              loading={loading}
              style={styles.modalButton}
            >
              Log Out
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowLogoutModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
          </Modal>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 12,
    color: "#333",
  },
  button: {
    marginTop: 16,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    marginVertical: 16,
  },
});

export default Settings;
