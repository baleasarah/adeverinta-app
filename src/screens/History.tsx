import React, { useState, useCallback, useEffect } from "react";
import { SafeAreaView, FlatList, StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { Text, ActivityIndicator, Badge } from "react-native-paper";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HistoryStackParamList } from "@/types/navigation";
import RequestCard, { Request } from "@/components/RequestCard";
import { useAuth } from "@/context/AuthContext";

type FilterType = 'all' | 'pending' | 'rejected' | 'signed';

const HistoryScreen = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const navigation = useNavigation<NativeStackNavigationProp<HistoryStackParamList>>();
  const route = useRoute();
  const db = getFirestore();

  // Check for filter parameter and set initial filter
  useEffect(() => {
    const params = route.params as { filter?: FilterType };
    if (params?.filter) {
      setActiveFilter(params.filter);
    }
  }, [route.params]);

  const fetchHistory = useCallback(async () => {
    if (!user) return; // no user, don't fetch

    setLoading(true);
    try {
      let q;

      if (isAdmin) {
        // Admin: get last 10 requests where status != pending
        q = query(
          collection(db, "requests"),
          where("status", "!=", "pending"),
          orderBy("status"), // Firestore requires orderBy on inequality field
          orderBy("timestamp", "desc"),
          limit(10)
        );
      } else {
        // Normal user: get all requests of this user, all statuses
        q = query(
          collection(db, "requests"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc")
        );
      }

      const querySnapshot = await getDocs(q);
      const reqs: Request[] = [];
      querySnapshot.forEach((doc) => {
        reqs.push({ id: doc.id, ...doc.data() } as Request);
      });

      if (isAdmin) {
        // Sort locally by timestamp descending (Firestore limitation)
        reqs.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());
        setAllRequests(reqs.slice(0, 10));
      } else {
        setAllRequests(reqs);
      }
    } catch (error) {
      console.error("Error fetching history requests:", error);
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  }, [db, user, isAdmin]);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && user) {
        fetchHistory();
      }
    }, [fetchHistory, authLoading, user])
  );

  // Filter requests based on active filter
  const filteredRequests = allRequests.filter((request) => {
    if (activeFilter === 'all') return true;
    return request.status === activeFilter;
  });

  // Calculate counts for each status
  const statusCounts = {
    all: allRequests.length,
    pending: allRequests.filter(r => r.status === 'pending').length,
    rejected: allRequests.filter(r => r.status === 'rejected').length,
    signed: allRequests.filter(r => r.status === 'signed').length,
  };

  const filters = [
    { key: 'all', label: 'Toate', count: statusCounts.all, color: '#6200ea' },
    { key: 'pending', label: 'Pending', count: statusCounts.pending, color: '#ff9800' },
    { key: 'rejected', label: 'Rejected', count: statusCounts.rejected, color: '#f44336' },
    { key: 'signed', label: 'Signed', count: statusCounts.signed, color: '#4caf50' },
  ];

  if (authLoading || loading) {
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
          History {isAdmin ? "(Last 10)" : ""}
        </Text>
      </View>

      {/* Filter badges */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            onPress={() => setActiveFilter(filter.key as FilterType)}
            style={[
              styles.filterBadgeContainer,
              activeFilter === filter.key && { backgroundColor: filter.color + '15' }
            ]}
          >
            <View style={styles.filterBadgeContent}>
              <Text style={[
                styles.filterBadgeText,
                activeFilter === filter.key && { color: filter.color, fontWeight: '600' }
              ]}>
                {filter.label}
              </Text>
              <Badge 
                style={[
                  styles.filterBadge,
                  { backgroundColor: filter.color }
                ]}
                size={20}
              >
                {filter.count}
              </Badge>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onPress={() =>
              navigation.navigate("RequestDetails", { requestId: item.id })
            }
          />
        )}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>
              {activeFilter === 'all' 
                ? "No historical requests found." 
                : `No ${activeFilter} requests found.`
              }
            </Text>
          </View>
        }
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
  filterContainer: {
    maxHeight: 60,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterContent: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterBadgeContainer: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  filterBadge: {
    marginLeft: 4,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    marginTop: 20,
    alignItems: "center",
  },
});

export default HistoryScreen;
