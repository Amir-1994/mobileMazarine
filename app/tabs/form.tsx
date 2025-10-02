import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import {
  Truck,
  UserIcon,
  Package,
  CheckCircle,
  X,
  Camera,
  FileText,
  MapPin,
  AlertTriangle,
} from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ExpoLocation from "expo-location";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import { AutocompleteSelect } from "@/components/AutocompleteSelect";
import { FormField } from "@/components/FormField";
import { PhotoPicker } from "@/components/PhotoPicker";
import { TextArea } from "@/components/TextArea";
import { LocationPicker } from "@/components/LocationPicker";
import { useFormStore } from "@/hooks/useFormStore";
import { useOfflineForms } from "@/hooks/useOfflineForms";
import { apiService, getAuthData, removeAuthData } from "@/services/api";
import { checkInternetConnection } from "@/utils/network";
import { Asset, Driver, Bac, Location, User } from "@/types/api";
import { useLocalSearchParams, useGlobalSearchParams, Link } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { useTranslation } from "react-i18next";

export default function FormScreen() {
  const { t } = useTranslation();

  const insets = useSafeAreaInsets();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();
  const { title, description, id } = useLocalSearchParams();

  const {
    formData,
    updateAsset,
    updateDriver,
    updateBac,
    updatePhoto,
    updateDescription,
    updateLocation,
    updateDate,
    resetForm,
    isFormValid,
  } = useFormStore();

  const { saveOfflineForm } = useOfflineForms();

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await getAuthData();
      if (!auth) {
        router.replace("/");
      } else {
        setUser(auth.user);
      }
    };
    checkAuth();
  }, [router]);

  const [isConnected, setIsConnected] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected || false);
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  const fetchAssets = async (term: string) => {
    return await apiService.queryAssets(term);
  };

  const fetchDrivers = async (term: string) => {
    return await apiService.queryDrivers(term);
  };

  const fetchBacs = async (term: string) => {
    return await apiService.queryBacs(term);
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const getCurrentLocationBackground = async (): Promise<Location | null> => {
    if (Platform.OS === "web") {
      // Web geolocation fallback
      if (!navigator.geolocation) {
        return null;
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location: Location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy || undefined,
              timestamp: Date.now(),
            };
            resolve(location);
          },
          () => {
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
          }
        );
      });
    }

    // Native geolocation
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    try {
      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 1,
      });

      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || undefined,
        timestamp: Date.now(),
      };

      // Try to get address (optional)
      try {
        const reverseGeocode = await ExpoLocation.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          location.address = `${address.street || ""} ${address.city || ""} ${
            address.region || ""
          }`.trim();
        }
      } catch (geocodeError) {
        console.log("Reverse geocoding failed:", geocodeError);
      }

      return location;
    } catch (err) {
      console.error("Location error:", err);
      return null;
    }
  };

  const handleSubmit = async () => {
    // Vérification des autres champs obligatoires d'abord
    if (
      !formData.selectedAsset ||
      !formData.selectedDriver ||
      !formData.selectedBac ||
      !formData.description
    ) {
      setShowSuccessModal(true);
      return;
    }

    // Toujours essayer d'obtenir la géolocalisation
    setIsGettingLocation(true);

    const location = await getCurrentLocationBackground();

    if (location) {
      // Géolocalisation obtenue avec succès
      updateLocation(location);
      console.log("Location obtained:", location);
      setIsGettingLocation(false);
      setShowConfirmationModal(true);
    } else {
      // Impossible d'obtenir la géolocalisation
      console.log("Failed to obtain location");
      setIsGettingLocation(false);
      setShowLocationAlert(true);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    resetForm();
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      let dataToSave = {
        _form_id: id,
        READ_ONLY: false,
        data: {
          description: formData.description,
          photo: {
            photo: formData.photo,
          },
          asset: {
            name: formData.selectedAsset?.name,
            _id: formData.selectedAsset?.id,
            //brand : formData.selectedAsset?.brand,
          },
          driver: {
            first_name: formData.selectedDriver?.firstName,
            last_name: formData.selectedDriver?.lastName,
            _id: formData.selectedDriver?.id,
          },
          bac: {
            name: formData.selectedBac?.name || "",

            _id: formData.selectedBac?.id,
          },
          loc: {
            type: "Point",
            coordinates: [
              formData.location?.longitude || 0,
              formData.location?.latitude || 0,
            ],
          },
          date: formData.date,
        },
        _company_owner: user?._company_owner?._id || user?._company_owner,
        user: user?._id,
      };
      console.log("title is ", title);
      let offlineToSave = {
        title: title,
        _form_id: id,
        READ_ONLY: false,
        data: {
          description: formData.description,
          photo: {
            photo: formData.photo,
          },
          asset: {
            name: formData.selectedAsset?.name,
            _id: formData.selectedAsset?.id,
            //brand : formData.selectedAsset?.brand,
          },
          driver: {
            first_name: formData.selectedDriver?.firstName,
            last_name: formData.selectedDriver?.lastName,
            _id: formData.selectedDriver?.id,
          },
          bac: {
            name: formData.selectedBac?.name || "",

            _id: formData.selectedBac?.id,
          },
          loc: {
            type: "Point",
            coordinates: [
              formData.location?.longitude || 0,
              formData.location?.latitude || 0,
            ],
          },
          date: formData.date,
        },
        _company_owner: user?._company_owner?._id || user?._company_owner,
        user: user?._id,
      };

      // Check internet connection

      if (isConnected) {
        // Save to server
        await apiService.saveFormData(dataToSave);
        setShowConfirmationModal(false);
        setShowSuccessModal(true); // Show success after saving
      } else {
        console.log("will save it offline");
        // Save offline
        await saveOfflineForm(offlineToSave);
        setShowConfirmationModal(false);
        Alert.alert(t("SAVE_OFFLINE"), t("LOCAL_SAVE"), [
          {
            text: "OK",
            onPress: () => {
              resetForm();
              router.back();
            },
          },
        ]);
      }
    } catch (error) {
      console.error(t("FORM_SAVIN_ERROR"), error);
      Alert.alert(t("Erreur"), t("FORM_SAVIN_ERROR"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmationModal(false);
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    if (user) {
      try {
        await apiService.logout({ id: user._id });
      } catch (error) {
        console.error(t("LOGOUT_ERROR"), error);
        Alert.alert(t("LOGOUT_ERROR"), t("LOGOUT_FAILED"));
      }
      await removeAuthData();
      router.replace("/");
    }
  };

  const renderAssetItem = (asset: Asset) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemIcon}>
        <Truck size={20} color="#5D866C" />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{asset.name}</Text>
        {asset.licensePlate && (
          <Text style={styles.itemSubtitle}>{asset.licensePlate}</Text>
        )}
        {asset.type && <Text style={styles.itemType}>{asset.type}</Text>}
      </View>
    </View>
  );

  const renderDriverItem = (driver: Driver) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemIcon}>
        <UserIcon size={20} color="#5D866C" />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>
          {driver?.firstName} {driver?.lastName}
        </Text>
        {driver.email && (
          <Text style={styles.itemSubtitle}>{driver.email}</Text>
        )}
        {driver.phone && <Text style={styles.itemType}>{driver.phone}</Text>}
      </View>
    </View>
  );

  const renderBacItem = (bac: Bac) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemIcon}>
        <Package size={20} color="#5D866C" />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{bac.name}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {user && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.userContainer}
              onPress={() => setShowLogoutModal(true)}
            >
              <Text style={styles.username}>{user.first_name}</Text>
              <Ionicons name="person-circle-outline" size={40} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Text style={styles.pageTitle}>{t(title)}</Text>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <FormField label={t("ASSET")} key={formData.selectedAsset?.id}>
            <AutocompleteSelect<Asset>
              fetchData={fetchAssets}
              value={formData.selectedAsset}
              onSelect={updateAsset}
              placeholder={t("SELECT_ASSET")}
              displayKey="name"
              renderItem={renderAssetItem}
            />
          </FormField>

          <FormField key={formData.selectedDriver?.id} label={t("DRIVER")}>
            <AutocompleteSelect<Driver>
              fetchData={fetchDrivers}
              value={formData.selectedDriver}
              onSelect={updateDriver}
              placeholder={t("SELECT_DRIVER")}
              displayKey="firstName"
              renderItem={renderDriverItem}
            />
          </FormField>

          <FormField label={t("BAC")} key={formData.selectedBac?.id}>
            <AutocompleteSelect<Bac>
              fetchData={fetchBacs}
              value={formData.selectedBac}
              onSelect={updateBac}
              placeholder={t("SELECT_BAC")}
              displayKey="name"
              renderItem={renderBacItem}
            />
          </FormField>

          <FormField label={t("PHOTO")}>
            <PhotoPicker
              value={formData.photo}
              onSelect={updatePhoto}
              placeholder={t("ADD_MISSION_PHOTO")}
            />
          </FormField>

          <FormField label={t("DESCRIPTION")}>
            <TextArea
              value={formData.description}
              onChangeText={updateDescription}
              placeholder={t("MISSION_DETAILS_DESCRIPTION")}
              maxLength={500}
            />
          </FormField>

          <FormField label={t("DATE")} required>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {formData.date
                  ? formData.date.toLocaleString()
                  : "Sélectionner une date et heure"}
              </Text>
            </TouchableOpacity>
          </FormField>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!formData.selectedAsset ||
                  !formData.selectedDriver ||
                  !formData.selectedBac ||
                  !formData.description ||
                  isGettingLocation ||
                  isSaving) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={
                !formData.selectedAsset ||
                !formData.selectedDriver ||
                !formData.selectedBac ||
                // !formData.photo || !formData.date
                !formData.description
                //  isGettingLocation ||
                //isSaving
              }
            >
              <LinearGradient
                colors={
                  formData.photo && formData.date && !isGettingLocation
                    ? ["#5D866C", "#4a6b58"]
                    : ["#C2A68C", "#a89078"]
                }
                style={styles.submitButtonGradient}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size={20} color="#fff" />
                ) : (
                  <CheckCircle size={20} color="#fff" />
                )}
                <Text style={styles.submitButtonText}>
                  {isGettingLocation
                    ? t("GEO")
                    : isSaving
                    ? t("SAVING")
                    : t("VALIDATE_FORM")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
              <Text style={styles.resetButtonText}>{t("RESET")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <Pressable style={styles.modalOverlay} onPress={handleModalClose}>
          <View style={styles.successModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isFormValid() ? t("FORM_SUBMITTED_SUCCESSFULLY") : t("ERROR")}
              </Text>
              <TouchableOpacity
                onPress={handleModalClose}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              {isFormValid() ? (
                <>
                  <CheckCircle
                    size={48}
                    color="#4CAF50"
                    style={styles.modalIcon}
                  />
                  <Text style={styles.modalText}>
                    {t("SUCCESS_FORM_SAVED")}
                  </Text>
                </>
              ) : (
                <Text style={styles.modalErrorText}>
                  {t("HAVE_TO_SAVE_APP_CREDENTIALS")}
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showConfirmationModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelConfirm}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCancelConfirm}>
          <View style={styles.confirmationModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("CONFIRM_SOUMISSION")}</Text>
              <TouchableOpacity
                onPress={handleCancelConfirm}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                {t("ASSET")}: {formData.selectedAsset?.name}
              </Text>
              <Text style={styles.modalText}>
                {t("DRIVER")}: {formData.selectedDriver?.name}
              </Text>
              <Text style={styles.modalText}>
                {t("BAC")}: {formData.selectedBac?.name}
              </Text>
              {formData.photo && (
                <View style={styles.modalPhotoContainer}>
                  <Camera size={16} color="#666" />
                  <Text style={styles.modalPhotoText}>Photo ajoutée</Text>
                </View>
              )}
              {formData.description && (
                <View style={styles.modalDescriptionContainer}>
                  <FileText size={16} color="#666" />
                  <Text style={styles.modalDescriptionText} numberOfLines={2}>
                    {formData.description}
                  </Text>
                </View>
              )}
              {formData.location && (
                <View style={styles.modalLocationContainer}>
                  <MapPin size={16} color="#666" />
                  <Text style={styles.modalLocationText}>
                    {t("POSITION")}: {formData.location.latitude.toFixed(6)},{" "}
                    {formData.location.longitude.toFixed(6)}
                  </Text>
                  {formData.location.address && (
                    <Text style={styles.modalLocationAddress} numberOfLines={1}>
                      {formData.location.address}
                    </Text>
                  )}
                </View>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelConfirm}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>{t("CANCEL")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    isSaving && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirmSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size={20} color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>{t("CONFIRM")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Modal d'alerte pour la géolocalisation */}
      <Modal
        visible={showLocationAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationAlert(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLocationAlert(false)}
        >
          <View style={styles.alertModal}>
            <View style={styles.alertHeader}>
              <View style={styles.alertIcon}>
                <AlertTriangle size={24} color="#ff6b6b" />
              </View>
              <Text style={styles.alertTitle}>{t("GEO_REQUIRED")}</Text>
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertText}>
                {t("LOCALISATION_GETTED_IMPOSSIBLE")}
              </Text>
            </View>
            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setShowLocationAlert(false)}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLogoutModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 20,
              width: "80%",
              maxWidth: 300,
            }}
            onPress={() => {}}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {t("LOGOUT")}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#ff4757",
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                alignItems: "center",
              }}
              onPress={handleLogout}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                {t("LOGOUT")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                marginTop: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={{ color: "#666", fontSize: 16 }}>{t("CANCEL")}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={formData.date || new Date()}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (event.type === "set" && selectedDate) {
              updateDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F0",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
    paddingTop: 30,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(93, 134, 108, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    margin: 2,
    display: "flex",
    flexDirection: "row",
    gap: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  itemType: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  buttonContainer: {
    marginTop: 40,
    gap: 16,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resetButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  resetButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  modalErrorText: {
    fontSize: 16,
    color: "#ff4757",
    textAlign: "center",
  },
  modalPhotoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  modalPhotoText: {
    fontSize: 14,
    color: "#666",
  },
  modalDescriptionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
    maxWidth: "100%",
  },
  modalDescriptionText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  modalLocationContainer: {
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  modalLocationText: {
    fontSize: 14,
    color: "#666",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  modalLocationAddress: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  alertModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: 320,
    width: "100%",
    alignSelf: "center",
  },
  alertHeader: {
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  alertContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  alertText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  alertActions: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  alertButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff6b6b",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#5D866C",
    textAlign: "center",
    marginVertical: 20,
    marginHorizontal: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  cameraButton: {
    padding: 8,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  username: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 100,
    paddingRight: 20,
  },
  menu: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    minWidth: 120,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 8,
  },
  menuText: {
    fontSize: 16,
    color: "#333",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#e1e5e9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  confirmationModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#5D866C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#a89078",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
