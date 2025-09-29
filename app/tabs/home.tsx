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
import { apiService, getAuthData, removeAuthData } from "@/services/api";
import { Asset, Driver, Bac, Location, User } from "@/types/api";

export default function FormScreen() {
  const insets = useSafeAreaInsets();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();
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

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await getAuthData();
      if (auth) {
        setUser(auth.user);
      } else {
        router.replace("/");
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    setShowMenu(false);
    if (user) {
      try {
        await apiService.logout({ id: user._id });
      } catch (error) {
        console.error("Logout error:", error);
        Alert.alert("Error", "Logout failed");
      }
      await removeAuthData();
      setUser(null);
      router.replace("/");
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split("T")[0];
      updateDate(dateString);
    }
  };

  const fetchAssets = async (term: string) => {
    return await apiService.queryAssets(term);
  };

  const fetchDrivers = async (term: string) => {
    return await apiService.queryDrivers(term);
  };

  const bacsQuery = useQuery({
    queryKey: ["bacs"],
    queryFn: () => apiService.getBacs({}),
  });

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
      setShowSuccessModal(true);
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

  const renderAssetItem = (asset: Asset) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemIcon}>
        <Truck size={20} color="#4a90e2" />
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
        <UserIcon size={20} color="#50c878" />
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
        <Package size={20} color="#ff6b6b" />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{bac.name}</Text>
        {bac.location && (
          <Text style={styles.itemSubtitle}>{bac.location}</Text>
        )}
        {bac.capacity && (
          <Text style={styles.itemType}>Capacité: {bac.capacity}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Formulaire de Mission</Text>
            <Text style={styles.headerSubtitle}>
              Sélectionnez un véhicule, un chauffeur et un bac
            </Text>
          </View>
          <View style={styles.headerRight}>
            {user && (
              <TouchableOpacity
                style={styles.userContainer}
                onPress={() => setShowMenu(true)}
              >
                <Ionicons name="person-circle-outline" size={40} color="#fff" />
                <Text style={styles.username}>{user.first_name}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <FormField label="Véhicule" required>
            <AutocompleteSelect<Asset>
              fetchData={fetchAssets}
              value={formData.selectedAsset}
              onSelect={updateAsset}
              placeholder="Sélectionner un véhicule"
              displayKey="name"
              renderItem={renderAssetItem}
            />
          </FormField>

          <FormField label="Chauffeur" required>
            <AutocompleteSelect<Driver>
              fetchData={fetchDrivers}
              value={formData.selectedDriver}
              onSelect={updateDriver}
              placeholder="Sélectionner un chauffeur"
              displayKey="firstName"
              renderItem={renderDriverItem}
            />
          </FormField>

          <FormField label="Bac" required>
            <AutocompleteSelect<Bac>
              data={bacsQuery.data || []}
              value={formData.selectedBac}
              onSelect={updateBac}
              placeholder="Sélectionner un bac"
              displayKey="name"
              searchKeys={["name", "location", "type"]}
              isLoading={bacsQuery.isLoading}
              error={bacsQuery.error?.message}
              renderItem={renderBacItem}
            />
          </FormField>

          <FormField label="Date">
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formData.date}</Text>
            </TouchableOpacity>
          </FormField>

          <FormField label="Photo">
            <PhotoPicker
              value={formData.photo}
              onSelect={updatePhoto}
              placeholder="Ajouter une photo de la mission"
            />
          </FormField>

          <FormField label="Description" required>
            <TextArea
              value={formData.description}
              onChangeText={updateDescription}
              placeholder="Décrivez la mission, les détails importants..."
              maxLength={500}
            />
          </FormField>

          <FormField label="Géolocalisation" required>
            <LocationPicker
              value={formData.location}
              onLocationSelect={updateLocation}
              placeholder="Obtenir votre position actuelle"
            />
          </FormField>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!formData.selectedAsset ||
                  !formData.selectedDriver ||
                  !formData.selectedBac ||
                  !formData.description ||
                  isGettingLocation) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={
                !formData.selectedAsset ||
                !formData.selectedDriver ||
                !formData.selectedBac ||
                !formData.description ||
                isGettingLocation
              }
            >
              <LinearGradient
                colors={
                  formData.selectedAsset &&
                  formData.selectedDriver &&
                  formData.selectedBac &&
                  formData.description &&
                  !isGettingLocation
                    ? ["#4CAF50", "#45a049"]
                    : ["#ccc", "#999"]
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
                    ? "Géolocalisation..."
                    : "Valider le formulaire"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
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
                {isFormValid() ? "Formulaire soumis" : "Erreur"}
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
                    Véhicule: {formData.selectedAsset?.name}
                  </Text>
                  <Text style={styles.modalText}>
                    Chauffeur: {formData.selectedDriver?.name}
                  </Text>
                  <Text style={styles.modalText}>
                    Bac: {formData.selectedBac?.name}
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
                      <Text
                        style={styles.modalDescriptionText}
                        numberOfLines={2}
                      >
                        {formData.description}
                      </Text>
                    </View>
                  )}
                  {formData.location && (
                    <View style={styles.modalLocationContainer}>
                      <MapPin size={16} color="#666" />
                      <Text style={styles.modalLocationText}>
                        Position: {formData.location.latitude.toFixed(6)},{" "}
                        {formData.location.longitude.toFixed(6)}
                      </Text>
                      {formData.location.address && (
                        <Text
                          style={styles.modalLocationAddress}
                          numberOfLines={1}
                        >
                          {formData.location.address}
                        </Text>
                      )}
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.modalErrorText}>
                  Veuillez remplir tous les champs obligatoires (véhicule,
                  chauffeur, bac, description et géolocalisation).
                </Text>
              )}
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
              <Text style={styles.alertTitle}>Géolocalisation requise</Text>
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertText}>
                Impossible d&apos;obtenir votre géolocalisation. Veuillez
                vérifier que la géolocalisation est activée sur votre appareil
                et réessayer.
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
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(formData.date)}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
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
    backgroundColor: "rgba(0, 0, 0, 0.05)",
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
    color: "#fff",
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
});
