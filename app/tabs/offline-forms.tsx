import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOfflineForms, OfflineForm } from "@/hooks/useOfflineForms";
import { apiService } from "@/services/api";
import { checkInternetConnection } from "@/utils/network";
import { TextArea } from "@/components/TextArea";
import { useTranslation } from "react-i18next";

export default function OfflineFormsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    offlineForms,
    deleteOfflineForm,
    clearOfflineForms,
    updateOfflineForm,
  } = useOfflineForms();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedDescription, setEditedDescription] = useState<string>("");
  const [getOfflineForms, setOfflineForms] = useState<any>([]);

  const { t } = useTranslation();
  useEffect(() => {
    if (offlineForms.length > 0) {
      setOfflineForms(offlineForms);
    }
  }, [offlineForms]);

  const handleDeleteForm = (id: string) => {
    Alert.alert(
      "Supprimer le formulaire",
      "Êtes-vous sûr de vouloir supprimer ce formulaire hors ligne ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteOfflineForm(id),
        },
      ]
    );
  };

  const handleSyncForm = async (form: OfflineForm) => {
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      Alert.alert(
        "Erreur",
        "Aucune connexion internet disponible. Veuillez vérifier votre connexion et réessayer."
      );
      return;
    }

    try {
      await apiService.saveFormData(form.data);
      deleteOfflineForm(form.id);
      Alert.alert("Succès", "Formulaire synchronisé avec succès");
    } catch (error) {
      console.error("Error syncing form:", error);
      Alert.alert("Erreur", "Échec de la synchronisation. Veuillez réessayer.");
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      "Effacer tout",
      "Êtes-vous sûr de vouloir supprimer tous les formulaires hors ligne ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Effacer tout",
          style: "destructive",
          onPress: clearOfflineForms,
        },
      ]
    );
  };

  const handleSave = () => {
    if (editingId) {
      const item = offlineForms.find((f) => f.id === editingId);
      if (item) {
        updateOfflineForm(editingId, {
          ...item.data,
          description: editedDescription,
        });
      }
      setEditingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.formInfo}>
          <Text style={styles.formTitle}>{item.title || t("DELETE_ALL")}</Text>
          {editingId === item.id ? (
            <TextArea
              value={editedDescription}
              onChangeText={setEditedDescription}
              placeholder="Entrez une description..."
              numberOfLines={2}
            />
          ) : (
            <Text style={styles.formDescription}>
              {item.data?.data?.description || "Pas de description"}
            </Text>
          )}
          <Text style={styles.formTimestamp}>
            Créé le {new Date(item.data?.data?.date).toLocaleString()}
          </Text>
        </View>
        <View style={styles.actions}>
          {editingId === item.id ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.syncButton]}
                onPress={() => handleSyncForm(item)}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteForm(item.id)}
              >
                <Ionicons name="trash" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Formulaires hors ligne</Text>
        {offlineForms.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Text style={styles.clearButtonText}>Effacer tout</Text>
          </TouchableOpacity>
        )}
      </View>

      {offlineForms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-offline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Aucun formulaire hors ligne</Text>
          <Text style={styles.emptySubtext}>
            Les formulaires sauvegardés hors ligne apparaîtront ici
          </Text>
        </View>
      ) : (
        <FlatList
          data={offlineForms}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ff4757",
    borderRadius: 6,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e1e5e9",
  },
  cardContent: {
    padding: 16,
  },
  formInfo: {
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  formTimestamp: {
    fontSize: 12,
    color: "#999",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  syncButton: {
    backgroundColor: "#4CAF50",
  },
  editButton: {
    backgroundColor: "#2196F3",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButton: {
    backgroundColor: "#FF9800",
  },
  deleteButton: {
    backgroundColor: "#f44336",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});
