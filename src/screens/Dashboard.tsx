import React, { useEffect, useState } from "react";
import { SafeAreaView, FlatList, StyleSheet, View } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DashboardStackParamList } from "@/types/navigation";
import RequestCard, { Request } from "@/components/RequestCard";

const DashboardScreen = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
  const db = getFirestore();

  const fetchRequests = async () => {
    try {
      const q = query(collection(db, "requests"), where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      const reqs: Request[] = [];
      querySnapshot.forEach((doc) => {
        reqs.push({ id: doc.id, ...doc.data() } as Request);
      });
      setRequests(reqs);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      // Fetch your data here whenever screen is focused
      fetchRequests();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator animating size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text variant="headlineMedium" style={styles.titleText}>
          Pending Requests ({requests.length})
        </Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onPress={() => navigation.navigate("RequestDetails", { requestId: item.id })}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  titleText: {
    textAlign: "left",
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default DashboardScreen;
