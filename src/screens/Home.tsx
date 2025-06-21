import React, { useEffect, useState } from "react";
import { StyleSheet, SafeAreaView, View, ActivityIndicator } from "react-native";
import {
  Text,
  Button,
  Chip,
  Card,
} from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList, MainTabParamList } from "../types/navigation";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { getAuth } from "firebase/auth";
import { doc, getFirestore, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { toTitleCase } from "@/utils/formatString";
import RequestStatsRow from "@/components/RequestStatsRow";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeScreen">;
type TabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

const Home = ({ navigation }: Props) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const { user } = useAuth();
  const tabNavigation = useNavigation<TabNavigationProp>();

  const fetchAdminStatus = async () => {
    const auth = getAuth();
    const db = getFirestore();

    const user = auth.currentUser;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const adminDocRef = doc(db, "admins", user.uid);
      const adminDocSnap = await getDoc(adminDocRef);
      setIsAdmin(adminDocSnap.exists());
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    const db = getFirestore();
    try {
      const requestsRef = collection(db, "requests");
      const q = query(requestsRef, where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      setPendingCount(querySnapshot.size);
    } catch (error) {
      console.error("Error fetching pending count:", error);
    }
  };

  useEffect(() => {
    fetchAdminStatus();
  }, []);

  // Refetch pending count every time the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (isAdmin) {
        fetchPendingCount();
      }
    }, [isAdmin])
  );

  const navigateToGenerateCertificate = () => {
    navigation.navigate("GenerateCertificate");
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ea" />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
            <Text style={styles.title}>Salut,</Text>
            {isAdmin && (
              <Chip
                style={styles.adminChip}
                textStyle={{ fontSize: 12, padding: 0, lineHeight: 12 }}
              >
                Admin
              </Chip>
            )}
          </View>
          <Text style={styles.name}>{toTitleCase(user?.displayName)}</Text>

          {isAdmin ? (
            <Card style={styles.adminCard}>
              <Card.Content>
                <View style={styles.adminCardContent}>
                  <View style={styles.adminCardLeft}>
                    <Text style={styles.adminCardTitle}>Cereri în Așteptare</Text>
                    <Text style={styles.adminCardSubtitle}>
                      {pendingCount > 0 
                        ? `Aveți ${pendingCount} cereri de adeverințe care așteaptă să fie revizuite`
                        : "Nu aveți cereri noi de adeverințe de revizuit"
                      }
                    </Text>
                  </View>
                  <Card style={styles.countCard}>
                    <Card.Content style={styles.countCardContent}>
                      <Text style={styles.adminCardCount}>{pendingCount}</Text>
                    </Card.Content>
                  </Card>
                </View>
                <Button 
                  mode="contained" 
                  onPress={() => tabNavigation.navigate("Dashboard")}
                  style={styles.reviewButton}
                >
                  {pendingCount > 0 ? "Revizuiește Cererile" : "Vezi Toate Cererile"}
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <>
              <RequestStatsRow />
              <View style={styles.buttonContainer}>
                <Button mode="outlined" onPress={navigateToGenerateCertificate}>
                  Genereaza Adeverinta
                </Button>
              </View>
            </>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 50,
    fontWeight: "bold",
    marginLeft: 20,
  },
  adminChip: {
    marginLeft: 10,
    marginBottom: 10,
    backgroundColor: "lightblue",
    padding: 0,
  },
  name: {
    fontSize: 40,
    fontWeight: "bold",
    letterSpacing: 3,
    marginLeft: 20,
    marginBottom: 30,
  },
  buttonContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  adminCard: {
    margin: 20,
    elevation: 4,
    backgroundColor: '#f8f9fa',
  },
  adminCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  adminCardLeft: {
    flex: 1,
    paddingRight: 20,
  },
  countCard: {
    backgroundColor: '#fff',
    elevation: 2,
    borderRadius: 12,
    minWidth: 100,
  },
  countCardContent: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'left',
  },
  adminCardSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'left',
  },
  adminCardCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6200ea',
  },
  reviewButton: {
    backgroundColor: '#6200ea',
  },
});

export default Home;
