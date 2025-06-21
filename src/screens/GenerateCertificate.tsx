import React, { useState, useEffect } from "react";
import { StyleSheet, SafeAreaView, ScrollView, View, TouchableOpacity, Dimensions } from "react-native";
import { Text, TextInput, Button, Modal, Portal, RadioButton, Divider, Card } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../types/navigation";
import CertificateRequestButton from "@/components/CertificateRequestButton";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

type Props = NativeStackScreenProps<HomeStackParamList, "GenerateCertificate">;

const certificateTypes = [
  {
    id: 1,
    label: "Obținerea reducerii la transport",
    value: "transport",
    icon: "🚌"
  },
  {
    id: 2,
    label: "Depunere dosar bursă",
    value: "bursa",
    icon: "💰"
  },
  {
    id: 3,
    label: "Angajare sau internship",
    value: "angajare",
    icon: "💼"
  },
  {
    id: 4,
    label: "Dosar cazare în cămin",
    value: "cazare",
    icon: "🏠"
  },
  {
    id: 5,
    label: "Viză sau permis de ședere",
    value: "viza",
    icon: "📋"
  },
  {
    id: 6,
    label: "Asigurare medicală / CNAS",
    value: "asigurare",
    icon: "🏥"
  },
  {
    id: 7,
    label: "Transfer universitar / echivalare studii",
    value: "transfer",
    icon: "🎓"
  },
  {
    id: 8,
    label: "Scutire de impozit / facilități fiscale",
    value: "impozit",
    icon: "📊"
  },
  {
    id: 9,
    label: "Prezentare la unități medicale / dosar medical",
    value: "medical",
    icon: "⚕️"
  },
  {
    id: 10,
    label: "Prezentare la instituții publice sau private",
    value: "institutii",
    icon: "🏛️"
  },
  {
    id: 11,
    label: "Alt motiv",
    value: "alt_motiv",
    icon: "📝"
  }
];

const formaInvatamantOptions = [
  { label: "Zi", value: "zi", description: "Program cu frecvență zilnică" },
  { label: "ID (Învățământ la distanță)", value: "id", description: "Program online" },
  { label: "FR (Frecvență redusă)", value: "fr", description: "Program cu întâlniri periodice" }
];

const finantareOptions = [
  { label: "Buget", value: "buget", description: "Finanțat de stat" },
  { label: "Taxă", value: "taxa", description: "Autofinanțat" }
];

const statutOptions = [
  { label: "Activ", value: "activ", description: "Student înscris și activ" },
  { label: "Suspendat", value: "suspendat", description: "Studii temporar suspendate" },
  { label: "Absolvent", value: "absolvent", description: "A finalizat studiile" }
];

const { height: screenHeight } = Dimensions.get('window');

const GenerateCertificate = ({ navigation }: Props) => {
  const { user } = useAuth();
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [formData, setFormData] = useState({
    numeComplet: '',
    cnp: '',
    facultatea: '',
    specializarea: '',
    anulDeStudiu: '',
    formaInvatamant: '',
    finantare: '',
    statut: '',
    tipAdeverinta: '',
    altMotiv: ''
  });

  const [modals, setModals] = useState({
    tipAdeverinta: false
  });

  const [tempSelection, setTempSelection] = useState('');

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showModal = (modalName: string) => {
    setTempSelection(formData[modalName as keyof typeof formData]);
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const hideModal = (modalName: string) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    setTempSelection('');
  };

  const confirmSelection = (field: string, modalName: string) => {
    updateFormData(field, tempSelection);
    hideModal(modalName);
  };

  const getDisplayValue = (field: string, options: any[]) => {
    const option = options.find(opt => opt.value === formData[field as keyof typeof formData]);
    return option ? option.label : `Selectează ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
  };

  const getCertificateDisplayValue = () => {
    const option = certificateTypes.find(opt => opt.value === formData.tipAdeverinta);
    return option ? `${option.icon} ${option.label}` : 'Selectează tipul adeverinței';
  };

  const renderOptionItem = (option: any, isSelected: boolean, onPress: () => void) => (
    <TouchableOpacity key={option.value} onPress={onPress} style={[
      styles.optionItem,
      isSelected && styles.selectedOptionItem
    ]}>
      <View style={styles.optionContent}>
        <View style={styles.optionLeft}>
          {option.icon && <Text style={styles.optionIcon}>{option.icon}</Text>}
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionTitle, isSelected && styles.selectedOptionTitle]}>
              {option.label}
            </Text>
            {option.description && (
              <Text style={[styles.optionDescription, isSelected && styles.selectedOptionDescription]}>
                {option.description}
              </Text>
            )}
          </View>
        </View>
        <RadioButton
          value={option.value}
          status={isSelected ? 'checked' : 'unchecked'}
          onPress={onPress}
        />
      </View>
    </TouchableOpacity>
  );

  const renderModal = (
    visible: boolean,
    onDismiss: () => void,
    title: string,
    options: any[],
    field: string,
    modalName: string
  ) => {
    const needsScroll = options.length > 6;
    
    return (
      <Portal>
        <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
          <Card style={[styles.modalCard, !needsScroll && styles.modalCardFit]}>
            <Card.Content style={styles.modalCardContent}>
              <Text style={styles.modalTitle}>{title}</Text>
              
              <View style={[styles.optionsContainer, needsScroll && styles.optionsContainerScroll]}>
                {needsScroll ? (
                  <ScrollView 
                    style={styles.modalScrollView}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    {options.map((option) => 
                      renderOptionItem(
                        option, 
                        tempSelection === option.value, 
                        () => setTempSelection(option.value)
                      )
                    )}
                  </ScrollView>
                ) : (
                  options.map((option) => 
                    renderOptionItem(
                      option, 
                      tempSelection === option.value, 
                      () => setTempSelection(option.value)
                    )
                  )
                )}
              </View>
              
              <View style={styles.modalActions}>
                <Button mode="text" onPress={onDismiss} style={styles.cancelButton}>
                  Anulează
                </Button>
                <Button 
                  mode="contained" 
                  onPress={() => confirmSelection(field, modalName)}
                  disabled={!tempSelection}
                  style={styles.confirmButton}
                >
                  Confirmă
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    );
  };

  useEffect(() => {
    const normalizeValue = (value:any, options:any) => {
      if (!value) return '';
      // Try to match ignoring case and diacritics
      const normalized = value
        .toString()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
      const found = options.find((opt:any) =>
        opt.value === value ||
        opt.label.toLowerCase() === value.toLowerCase() ||
        opt.label
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase() === normalized
      );
      return found ? found.value : '';
    };
    const fetchUserData = async () => {
      if (!user) {
        setLoadingUserData(false);
        return;
      }
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData(prev => ({
            ...prev,
            numeComplet: data.name || "",
            cnp: data.cnp || "",
            facultatea: data.faculty || "",
            specializarea: data.specialization || "",
            anulDeStudiu: data.studyYear || "",
            formaInvatamant: normalizeValue(data.studyType, formaInvatamantOptions),
            finantare: normalizeValue(data.financing, finantareOptions),
            statut: normalizeValue(data.status, statutOptions)
          }));
        }
      } catch (e) {
        // Optionally handle error
      } finally {
        setLoadingUserData(false);
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    // For each modal, if open, update tempSelection to match formData
    const modalFields = [
      { modal: 'tipAdeverinta', field: 'tipAdeverinta' },
    ];
    for (const { modal, field } of modalFields) {
      if (modals[modal as keyof typeof modals]) {
        if (tempSelection !== formData[field as keyof typeof formData]) {
          setTempSelection(formData[field as keyof typeof formData] || '');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, modals]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Generare Adeverinta</Text>


        <View style={styles.userInfoSection}>
          <Text style={styles.sectionTitle}>Informații personale</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nume complet:</Text>
            <Text style={styles.infoValue}>{formData.numeComplet || 'Nu disponibil'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CNP:</Text>
            <Text style={styles.infoValue}>{formData.cnp || 'Nu disponibil'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Facultatea:</Text>
            <Text style={styles.infoValue}>{formData.facultatea || 'Nu disponibil'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Specializarea:</Text>
            <Text style={styles.infoValue}>{formData.specializarea || 'Nu disponibil'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Anul de studiu:</Text>
            <Text style={styles.infoValue}>{formData.anulDeStudiu || 'Nu disponibil'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Forma de învățământ:</Text>
            <Text style={styles.infoValue}>
              {getDisplayValue('formaInvatamant', formaInvatamantOptions) || 'Nu disponibil'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Finanțare:</Text>
            <Text style={styles.infoValue}>
              {getDisplayValue('finantare', finantareOptions) || 'Nu disponibil'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Statut:</Text>
            <Text style={styles.infoValue}>
              {getDisplayValue('statut', statutOptions) || 'Nu disponibil'}
            </Text>
          </View>
        </View>

        <View style={styles.certificateSection}>
          <Text style={styles.sectionTitle}>Tipul adeverinței</Text>
          <Button
            mode="outlined"
            onPress={() => showModal('tipAdeverinta')}
            style={styles.selectButton}
            contentStyle={styles.selectButtonContent}
            icon="chevron-down"
          >
            {getCertificateDisplayValue()}
          </Button>

          {formData.tipAdeverinta === 'alt_motiv' && (
            <TextInput
              label="Specificați alt motiv"
              value={formData.altMotiv}
              onChangeText={(text) => updateFormData('altMotiv', text)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          )}
        </View>

        <CertificateRequestButton 
          formData={formData}
          onSuccess={() => {
            // Reset only the certificate type fields, preserve user data
            setFormData(prev => ({
              ...prev,
              tipAdeverinta: '',
              altMotiv: ''
            }));
            // Navigate back to home
            navigation.goBack();
          }}
        />
      </ScrollView>

      {/* Modal pentru Tipul adeverinței */}
      {renderModal(
        modals.tipAdeverinta,
        () => hideModal('tipAdeverinta'),
        'Selectează tipul adeverinței',
        certificateTypes,
        'tipAdeverinta',
        'tipAdeverinta'
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  infoText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#888",
    fontStyle: "italic",
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 8,
    color: "#333",
  },
  selectButton: {
    marginBottom: 16,
    justifyContent: 'flex-start',
  },
  selectButtonContent: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    flexDirection: 'row-reverse',
  },
  modal: {
    padding: 20,
    justifyContent: 'center',
  },
  modalCard: {
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  modalCardFit: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
  },
  modalCardContent: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionsContainerScroll: {
    maxHeight: screenHeight * 0.5,
  },
  modalScrollView: {
    flexGrow: 0,
  },
  optionItem: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedOptionItem: {
    backgroundColor: '#e8f4fd',
    borderColor: '#6200ea',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 22,
  },
  selectedOptionTitle: {
    color: '#6200ea',
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  selectedOptionDescription: {
    color: '#4a5568',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
  },
  confirmButton: {
    minWidth: 120,
    paddingHorizontal: 24,
  },
  userInfoSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#2c3e50',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: '#6c757d',
    flex: 2,
    textAlign: 'right',
  },
  certificateSection: {
    marginBottom: 24,
  },
});

export default GenerateCertificate; 