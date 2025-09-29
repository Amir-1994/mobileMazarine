import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAuthData, removeAuthData, apiService } from "../services/api";
import { User } from "../types/api";

interface FormItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const formItems: FormItem[] = [
  {
    id: "1",
    title: "Mission de livraison",
    description:
      "Formulaire pour enregistrer une mission de livraison avec chauffeur et véhicule.",
    icon: "car",
  },
  {
    id: "2",
    title: "Maintenance véhicule",
    description: "Rapport de maintenance pour les véhicules de la flotte.",
    icon: "build",
  },
  {
    id: "3",
    title: "Contrôle qualité",
    description: "Évaluation de la qualité des services et équipements.",
    icon: "checkmark-circle",
  },
  {
    id: "4",
    title: "Incident routier",
    description: "Signalement d'incidents survenus pendant les missions.",
    icon: "warning",
  },
  {
    id: "5",
    title: "Évaluation chauffeur",
    description: "Formulaire d'évaluation des performances des chauffeurs.",
    icon: "person",
  },
];

export default function FormListScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();

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

  const handleLogout = async () => {
    setShowLogoutModal(false);
    if (user) {
      try {
        await apiService.logout({ id: user._id });
      } catch (error) {
        console.error("Logout error:", error);
        Alert.alert("Error", "Logout failed");
      }
      await removeAuthData();
      router.replace("/");
    }
  };

  const renderItem = ({ item }: { item: FormItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push("/tabs/home")}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={32} color="#5D866C" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#C2A68C" />
      </View>
    </TouchableOpacity>
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
      <Text style={styles.pageTitle}>Liste des formulaires</Text>
      <FlatList
        data={formItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

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
              Se déconnecter
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
                Déconnexion
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
              <Text style={{ color: "#666", fontSize: 16 }}>Annuler</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
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
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#5D866C",
    textAlign: "center",
    marginVertical: 20,
    marginHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(93, 134, 108, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
