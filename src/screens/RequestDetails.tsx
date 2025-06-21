import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
  View,
  Dimensions,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Text, Button, Card, ActivityIndicator, Chip, Divider } from "react-native-paper";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
  deleteDoc,
  increment,
} from "firebase/firestore";
import dayjs from "dayjs";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import PdfViewer from "@/components/PdfViewer";
import SignCertificateButton from "@/components/SignCertificateButton";
import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { toTitleCase } from "@/utils/formatString";

interface Request {
  id: string;
  email: string;
  name: string;
  status: string;
  timestamp: any;
  userId: string;
  type: string;
  // Form data fields
  numeComplet?: string;
  cnp?: string;
  facultatea?: string;
  specializarea?: string;
  anulDeStudiu?: string;
  formaInvatamant?: string;
  finantare?: string;
  studentStatus?: string;
  altMotiv?: string;
  // Signed document fields
  signedDocumentUrl?: string;
  signedAt?: any;
}

const { width } = Dimensions.get('window');

const RequestDetails = ({ route, navigation }: any) => {
  const { requestId } = route.params;
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const db = getFirestore();
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const docRef = doc(db, "requests", requestId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRequest({ id: docSnap.id, ...docSnap.data() } as Request);
        } else {
          Alert.alert("Request not found");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching request:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  useEffect(() => {
    if (!request) return;

    const fetchTemplateUrl = async () => {
      const db = getFirestore();
      const storage = getStorage();

      try {
        // Query Firestore for template path by type
        const q = query(
          collection(db, "certificateTemplates"),
          where("type", "==", request.type)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          const storagePath = data.storagePath; // e.g. "templates/templateA.pdf"

          // Get download URL from Firebase Storage
          const storageRef = ref(storage, storagePath);
          const url = await getDownloadURL(storageRef);
          setTemplateUrl(url);
        }
      } catch (error) {
        console.error("Error fetching template URL:", error);
      }
    };

    fetchTemplateUrl();
  }, [request]);

  const updateStatus = async (newStatus: string) => {
    if (!request) return;
    setProcessing(true);
    try {
      const docRef = doc(db, "requests", request.id);
      await updateDoc(docRef, { status: newStatus });

      // Update user's request counts
      const userDocRef = doc(db, "users", request.userId);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error("User document not found");
      }
      const userData = userDoc.data();
      const currentCounts = userData.requestCounts || { pending: 0, signed: 0, rejected: 0 };

      await updateDoc(userDocRef, {
        requestCounts: {
          pending: currentCounts.pending - 1,
          signed: currentCounts.signed,
          rejected: currentCounts.rejected + 1
        }
      });

      Alert.alert(`Request ${newStatus}`);
      navigation.goBack();
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Failed to update status");
    } finally {
      setProcessing(false);
    }
  };

  const deleteRequest = async () => {
    if (!request || !user) return;

    Alert.alert(
      "Șterge cererea",
      "Ești sigur că vrei să ștergi această cerere? Această acțiune nu poate fi anulată.",
      [
        {
          text: "Anulează",
          style: "cancel",
        },
        {
          text: "Șterge",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              // Delete the request document
              await deleteDoc(doc(db, "requests", request.id));
              
              // Update user's request count
              const userDocRef = doc(db, "users", user.uid);
              await updateDoc(userDocRef, {
                [`requestCounts.${request.status}`]: increment(-1)
              });

              Alert.alert("Succes", "Cererea a fost ștearsă cu succes.", [
                {
                  text: "OK",
                  onPress: () => navigation.goBack()
                }
              ]);
            } catch (error) {
              console.error("Error deleting request:", error);
              Alert.alert("Eroare", "Nu s-a putut șterge cererea. Te rugăm să încerci din nou.");
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': 
        return { 
          color: '#ff9800', 
          icon: 'clock-outline', 
          bg: '#fff8e1',
          darkBg: '#ffecb3'
        };
      case 'rejected': 
        return { 
          color: '#f44336', 
          icon: 'close-circle-outline', 
          bg: '#ffebee',
          darkBg: '#ffcdd2'
        };
      case 'signed': 
        return { 
          color: '#4caf50', 
          icon: 'check-circle-outline', 
          bg: '#e8f5e8',
          darkBg: '#c8e6c9'
        };
      default: 
        return { 
          color: '#6200ea', 
          icon: 'information-outline', 
          bg: '#f3e5f5',
          darkBg: '#e1bee7'
        };
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMapping: { [key: string]: { label: string; icon: string; color: string; bg: string } } = {
      'transport': { 
        label: 'Obținerea reducerii la transport', 
        icon: 'bus', 
        color: '#e3f2fd',
        bg: '#e3f2fd'
      },
      'bursa': { 
        label: 'Depunere dosar bursă', 
        icon: 'currency-usd', 
        color: '#fff3e0',
        bg: '#fff3e0'
      },
      'angajare': { 
        label: 'Angajare sau internship', 
        icon: 'briefcase', 
        color: '#e8f5e8',
        bg: '#e8f5e8'
      },
      'cazare': { 
        label: 'Dosar cazare în cămin', 
        icon: 'home', 
        color: '#f3e5f5',
        bg: '#f3e5f5'
      },
      'viza': { 
        label: 'Viză sau permis de ședere', 
        icon: 'passport', 
        color: '#ffebee',
        bg: '#ffebee'
      },
      'asigurare': { 
        label: 'Asigurare medicală / CNAS', 
        icon: 'medical-bag', 
        color: '#e0f2f1',
        bg: '#e0f2f1'
      },
      'transfer': { 
        label: 'Transfer universitar / echivalare studii', 
        icon: 'school', 
        color: '#fbe9e7',
        bg: '#fbe9e7'
      },
      'impozit': { 
        label: 'Scutire de impozit / facilități fiscale', 
        icon: 'calculator', 
        color: '#efebe9',
        bg: '#efebe9'
      },
      'medical': { 
        label: 'Prezentare la unități medicale / dosar medical', 
        icon: 'hospital', 
        color: '#fce4ec',
        bg: '#fce4ec'
      },
      'institutii': { 
        label: 'Prezentare la instituții publice sau private', 
        icon: 'domain', 
        color: '#eceff1',
        bg: '#eceff1'
      },
      'alt_motiv': { 
        label: 'Alt motiv', 
        icon: 'text-box', 
        color: '#f3e5f5',
        bg: '#f3e5f5'
      }
    };
    return typeMapping[type] || { 
      label: type, 
      icon: 'file-document', 
      color: '#f3e5f5',
      bg: '#f3e5f5'
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator animating size="large" />
      </SafeAreaView>
    );
  }

  if (!request) return null;

  const isOwner = user?.uid === request.userId;
  const canDelete = isOwner && request.status === 'pending';
  const statusConfig = getStatusConfig(request.status);
  const typeConfig = getTypeLabel(request.type);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Card with Status */}
        <View style={[styles.headerCard, { backgroundColor: statusConfig.darkBg }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons 
                name={statusConfig.icon as any} 
                size={45} 
                color={statusConfig.color} 
              />
            </View>
            <Text style={[styles.headerTitle, { color: statusConfig.color }]}>Cerere Adeverință</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
              <Text style={[styles.headerStatus, { color: statusConfig.color }]}>{request.status.toUpperCase()}</Text>
            </View>
            <Text style={[styles.headerDate, { color: statusConfig.color + 'CC' }]}>
              {dayjs(request.timestamp?.toDate()).format("D MMMM YYYY")}
            </Text>
          </View>
        </View>

        {/* Personal Information Card */}
        <Card style={[styles.sectionCard, { backgroundColor: '#ffffff' }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#e8eaf6' }]}>
              <MaterialCommunityIcons name="account" size={24} color="#6200ea" />
            </View>
            <Text style={styles.sectionTitle}>Informații Personale</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#666" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Nume complet</Text>
                <Text style={styles.infoValue}>{request.numeComplet || request.name}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="card-account-details" size={20} color="#666" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>CNP</Text>
                <Text style={styles.infoValue}>{request.cnp || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#666" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{request.email}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Academic Information Card */}
        <Card style={[styles.sectionCard, { backgroundColor: '#f1f8e9' }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#c8e6c9' }]}>
              <MaterialCommunityIcons name="school" size={24} color="#2e7d32" />
            </View>
            <Text style={styles.sectionTitle}>Informații Academice</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="domain" size={20} color="#666" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Facultatea</Text>
                <Text style={styles.infoValue}>{request.facultatea || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="book-open-variant" size={20} color="#666" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Specializarea</Text>
                <Text style={styles.infoValue}>{request.specializarea || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="numeric" size={20} color="#666" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Anul de studiu</Text>
                <Text style={styles.infoValue}>{request.anulDeStudiu || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="clock-time-four" size={20} color="#666" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Forma de învățământ</Text>
                <Text style={styles.infoValue}>{request.formaInvatamant || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="currency-usd" size={20} color="#666" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Finanțare</Text>
                <Text style={styles.infoValue}>{request.finantare || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="account-check" size={20} color="#666" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Statut student</Text>
                <Text style={styles.infoValue}>{request.studentStatus || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Certificate Type Card */}
        <View style={[styles.typeCard, { backgroundColor: typeConfig.color, borderWidth: 3, borderColor: '#ddd' }]}>
          <View style={styles.typeContent}>
            <View style={[styles.typeIconContainer, { backgroundColor: 'rgba(100,100,100,0.15)' }]}>
              <MaterialCommunityIcons name={typeConfig.icon as any} size={36} color="#444" />
            </View>
            <Text style={[styles.typeTitle, { color: '#333' }]}>Scopul Adeverinței</Text>
            <Text style={[styles.typeLabel, { color: '#555' }]}>{typeConfig.label}</Text>
            {request.altMotiv && (
              <Text style={[styles.typeDescription, { color: '#666' }]}>{request.altMotiv}</Text>
            )}
          </View>
        </View>

        {/* Actions Card - hide admin buttons for signed documents */}
        {(isAdmin && request.status !== 'signed' || canDelete) && (
          <Card style={[styles.actionsCard, { backgroundColor: '#fafafa' }]}>
            <View style={styles.actionsContent}>
              {isAdmin && request.status !== 'signed' && (
                <>
                  <SignCertificateButton
                    requestId={request.id}
                    studentName={toTitleCase(user?.displayName || 'Admin')}
                    onSignedSuccess={() => navigation.goBack()}
                  />
                  <Button
                    mode="outlined"
                    onPress={() => updateStatus("rejected")}
                    loading={processing}
                    disabled={processing}
                    style={styles.actionButton}
                    buttonColor="#fff"
                    textColor="#f44336"
                  >
                    Reject
                  </Button>
                </>
              )}
              
              {canDelete && (
                <Button
                  mode="contained"
                  onPress={deleteRequest}
                  loading={deleting}
                  disabled={deleting}
                  buttonColor="#f44336"
                  style={styles.deleteButton}
                  icon="delete"
                >
                  {deleting ? "Se șterge..." : "Șterge cererea"}
                </Button>
              )}
            </View>
          </Card>
        )}

        {/* Signed Document Card - show only if document is signed */}
        {request.status === 'signed' && request.signedDocumentUrl && (
          <Card style={[styles.sectionCard, { backgroundColor: '#e8f5e8' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#c8e6c9' }]}>
                <MaterialCommunityIcons name="file-check" size={24} color="#2e7d32" />
              </View>
              <Text style={styles.sectionTitle}>Document Semnat</Text>
            </View>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="calendar-check" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Data semnării</Text>
                  <Text style={styles.infoValue}>
                    {request.signedAt ? dayjs(request.signedAt.toDate()).format("D MMMM YYYY, HH:mm") : 'N/A'}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.downloadButton}
                onPress={async () => {
                  if (request.signedDocumentUrl) {
                    try {
                      const supported = await Linking.canOpenURL(request.signedDocumentUrl);
                      if (supported) {
                        await Linking.openURL(request.signedDocumentUrl);
                      } else {
                        Alert.alert(
                          "Cannot open document", 
                          "Unable to open the signed document. Please copy the link manually.",
                          [
                            { text: "Cancel", style: "cancel" },
                            { 
                              text: "Copy Link", 
                              onPress: () => {
                                // You might want to use Clipboard here
                                Alert.alert("Document Link", request.signedDocumentUrl);
                              }
                            }
                          ]
                        );
                      }
                    } catch (error) {
                      console.error("Error opening document:", error);
                      Alert.alert("Error", "Failed to open document");
                    }
                  }
                }}
              >
                <MaterialCommunityIcons name="download" size={20} color="#2e7d32" />
                <Text style={styles.downloadText}>Descarcă documentul semnat</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#2e7d32" />
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {templateUrl && isAdmin && (
          <Card style={[styles.sectionCard, { backgroundColor: '#fff3e0' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#ffccbc' }]}>
                <MaterialCommunityIcons name="file-pdf-box" size={24} color="#e65100" />
              </View>
              <Text style={styles.sectionTitle}>Template Adeverință</Text>
            </View>
            <View style={styles.pdfContainer}>
              <PdfViewer uri={templateUrl} />
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f7fa" 
  },
  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  scrollContent: {
    paddingBottom: 30,
  },
  headerCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 25,
    borderRadius: 24,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  headerContent: {
    padding: 35,
    alignItems: 'center',
  },
  headerIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  headerStatus: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerDate: {
    fontSize: 15,
    fontWeight: '500',
  },
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  infoGrid: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  infoText: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 17,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  typeCard: {
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  typeContent: {
    padding: 30,
    alignItems: 'center',
  },
  typeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },
  typeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  typeLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  typeDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  actionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    elevation: 6,
  },
  actionsContent: {
    padding: 24,
    gap: 16,
  },
  actionButton: {
    borderRadius: 30,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#f44336',
  },
  deleteButton: {
    borderRadius: 30,
    paddingVertical: 8,
  },
  pdfContainer: {
    height: 400,
    margin: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 8,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 16,
  },
  downloadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginLeft: 8,
    flex: 1,
  },
});

export default RequestDetails;
