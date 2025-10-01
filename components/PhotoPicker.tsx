import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import { Camera, ImageIcon, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

interface PhotoPickerProps {
  value: string | null;
  onSelect: (photo: string | null) => void;
  placeholder?: string;
}

export function PhotoPicker({
  value,
  onSelect,
  placeholder = "Ajouter une photo",
}: PhotoPickerProps) {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "Nous avons besoin de votre permission pour accéder à vos photos."
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const base64Image = `data:${asset.mimeType || "image/jpeg"};base64,${
            asset.base64
          }`;
          onSelect(base64Image);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === "web") {
      // On web, fallback to image picker
      pickImage();
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "Nous avons besoin de votre permission pour utiliser l'appareil photo."
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const base64Image = `data:${asset.mimeType || "image/jpeg"};base64,${
            asset.base64
          }`;
          onSelect(base64Image);
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Erreur", "Impossible de prendre la photo");
    } finally {
      setIsLoading(false);
    }
  };

  const showOptions = () => {
    Alert.alert(
      "Sélectionner une photo",
      "Choisissez une option",
      [
        {
          text: "Galerie",
          onPress: pickImage,
        },
        {
          text: "Appareil photo",
          onPress: takePhoto,
        },
        {
          text: "Annuler",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const removePhoto = () => {
    onSelect(null);
  };

  if (value) {
    return (
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: value }} style={styles.image} />
          <TouchableOpacity style={styles.removeButton} onPress={removePhoto}>
            <X size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.changeButton}
          onPress={showOptions}
          disabled={isLoading}
        >
          <Text style={styles.changeButtonText}>
            {isLoading ? "Chargement..." : "Changer la photo"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.picker}
      onPress={showOptions}
      disabled={isLoading}
    >
      <LinearGradient
        colors={["#f8f9fa", "#e9ecef"]}
        style={styles.pickerGradient}
      >
        <View style={styles.pickerContent}>
          <View style={styles.iconContainer}>
            {Platform.OS === "web" ? (
              <ImageIcon size={24} color="#6c757d" />
            ) : (
              <Camera size={24} color="#6c757d" />
            )}
          </View>
          <Text style={styles.pickerText}>
            {isLoading ? t("LOADING") : placeholder}
          </Text>
          <Text style={styles.pickerSubtext}>
            {Platform.OS === "web" ? t("SELECT_PRESS") : t("PRESS_TO_SELECT")}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  changeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeButtonText: {
    color: "#4a90e2",
    fontSize: 14,
    fontWeight: "500",
  },
  picker: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderStyle: "dashed",
  },
  pickerGradient: {
    padding: 24,
  },
  pickerContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(108, 117, 125, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  pickerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 4,
  },
  pickerSubtext: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
  },
});
