import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card, IconButton } from "react-native-paper";
import dayjs from "dayjs";

export interface Request {
  id: string;
  email: string;
  name: string;
  status: string;
  timestamp: any; // Firestore timestamp
  userId: string;
  type: string;
}

interface RequestCardProps {
  request: Request;
  onPress: () => void;
}

const statusColors = {
  pending: "#f0ad4e",   // orange/yellow
  signed: "#5cb85c",    // green
  rejected: "#d9534f",  // red
};

const RequestCard: React.FC<RequestCardProps> = ({ request, onPress }) => {
  const borderColor = statusColors[request.status as keyof typeof statusColors] || "#ccc";

  return (
    <TouchableOpacity onPress={onPress} style={[styles.cardWrapper]}>
      <Card style={[styles.card, { borderLeftColor: borderColor }]}>

        <Card.Content>
          <View style={styles.cardRow}>
            {/* Left Column */}
            <View style={styles.columnLeft}>
              <View style={styles.row}>
                <IconButton
                  icon="account"
                  size={20}
                  style={styles.icon}
                  accessibilityLabel="User icon"
                />
                <Text variant="titleMedium" numberOfLines={1} style={styles.nameText}>
                  {request.name}
                </Text>
              </View>
              <View style={styles.row}>
                <IconButton
                  icon="email"
                  size={18}
                  style={styles.icon}
                  accessibilityLabel="Email icon"
                />
                <Text variant="bodySmall" numberOfLines={1} style={styles.emailText}>
                  {request.email}
                </Text>
              </View>
            </View>

            {/* Right Column */}
            <View style={styles.columnRight}>
              <View style={styles.row}>
                <IconButton
                  icon="certificate"
                  size={20}
                  iconColor="#6200ee"
                  style={styles.icon}
                  accessibilityLabel="Certificate icon"
                />
                <Text variant="bodyMedium" style={styles.typeText}>
                  {request.type || "N/A"}
                </Text>
              </View>
              <View style={styles.row}>
                <IconButton
                  icon="calendar"
                  size={20}
                  iconColor="gray"
                  style={styles.icon}
                  accessibilityLabel="Date icon"
                />
                <Text variant="bodySmall" style={styles.dateText}>
                  {dayjs(request.timestamp?.toDate()).format("MMM D, YYYY h:mm A")}
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    elevation: 3,
    backgroundColor: "#fff",
    borderLeftWidth: 6,
    overflow: "hidden", // so borderLeft color is visible cleanly
  },
  statusIconContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 12,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 4,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  columnLeft: {
    flex: 1,
    paddingRight: 10,
    justifyContent: "center",
  },
  columnRight: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  icon: {
    margin: 0,
    marginRight: 6,
  },
  nameText: {
    fontWeight: "600",
    flexShrink: 1,
  },
  emailText: {
    color: "gray",
    flexShrink: 1,
  },
  typeText: {
    color: "#6200ee",
  },
  dateText: {
    color: "gray",
  },
});

export default RequestCard;
