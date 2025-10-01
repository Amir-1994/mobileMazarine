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
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getAuthData, removeAuthData, apiService } from "@/services/api";
import { User } from "@/types/api";
import { useTranslation } from "react-i18next";
interface FormItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function FormListScreen() {
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();

  const {
    data: forms = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["forms"],
    queryFn: () => apiService.queryForms(10, 1),
  });

  const formItems: FormItem[] = (forms as any[]).map((form: any) => ({
    id: form._id || form.id,
    title: form.name || form.title || "Formulaire",
    description: form.description || "Description non disponible",
    icon: "document" as keyof typeof Ionicons.glyphMap,
  }));

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

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        console.log("000001", item);
        router.push({
          pathname: "/tabs/form",
          params: {
            title: item.title,
            description: item.description,
            id: item.id,
          },
        });
      }}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={32} color="#5D866C" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t(item.title)}</Text>
          <Text style={styles.description}>{t(item.description)}</Text>
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
              style={styles.userContainer}
              onPress={() => setShowLogoutModal(true)}
            >
              <Text style={styles.username}>{user.first_name}</Text>
              <Ionicons name="person-circle-outline" size={40} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Text style={styles.pageTitle}>{t("form_list")}</Text>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5D866C" />
          <Text style={styles.loadingText}>Chargement des formulaires...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Erreur lors du chargement des formulaires
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {}}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={formItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

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
    justifyContent: "flex-end",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff4757",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#5D866C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
