import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Text, Badge } from "react-native-paper";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "@/types/navigation";
import { useFocusEffect } from "@react-navigation/native";

type NavigationProp = BottomTabNavigationProp<MainTabParamList>;

const RequestStatsRow = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [counts, setCounts] = useState({
    pending: 0,
    declined: 0,
    completed: 0,
  });

  const fetchCounts = async () => {
    if (!user) return;
    
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      setCounts({
        pending: data.requestCounts?.pending || 0,
        declined: data.requestCounts?.rejected || 0,
        completed: data.requestCounts?.signed || 0,
      });
    }
  };

  // Refetch counts every time the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchCounts();
    }, [user])
  );

  const handleCardPress = (filter: 'pending' | 'rejected' | 'signed') => {
    navigation.navigate('History', { 
      screen: 'HistoryScreen', 
      params: { filter } 
    });
  };

  const items = [
    {
      label: "Pending",
      count: counts.pending,
      color: "#FFA500", // orange
      icon: "clock-outline",
      filter: 'pending' as const,
    },
    {
      label: "Declined",
      count: counts.declined,
      color: "#F44336", // red
      icon: "close-circle-outline",
      filter: 'rejected' as const,
    },
    {
      label: "Signed",
      count: counts.completed,
      color: "#4CAF50", // green
      icon: "check-circle-outline",
      filter: 'signed' as const,
    },
  ];

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.label}
          onPress={() => handleCardPress(item.filter)}
          style={styles.touchable}
        >
          <Card
            style={[styles.card, { backgroundColor: "white", borderColor: item.color + "20", borderWidth: 4 }]}
          >
            <View style={styles.cardContent}>
              <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
              <Text variant="titleMedium">{item.label}</Text>
              <Text variant="headlineSmall">{item.count}</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 8,
    marginTop: 60,
    height: 110,
  },
  touchable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    position: "relative",
    elevation: 2,
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
    height: 80,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
  },
});

export default RequestStatsRow;
