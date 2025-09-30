import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Server,
  Database,
  Wifi,
  Info,
  HelpCircle,
  ExternalLink,
} from "lucide-react-native";
import { getAuthData } from "@/services/api";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const settingsItems = [
    {
      icon: Server,
      title: "Configuration API",
      subtitle: "Gérer les endpoints et authentification",
      color: "#4a90e2",
    },
    {
      icon: Database,
      title: "Cache des données",
      subtitle: "Vider le cache local",
      color: "#50c878",
    },
    {
      icon: Wifi,
      title: "Mode hors ligne",
      subtitle: "Synchronisation automatique",
      color: "#ff6b6b",
    },
    {
      icon: Info,
      title: "À propos",
      subtitle: "Version 1.0.0",
      color: "#9b59b6",
    },
    {
      icon: HelpCircle,
      title: "Aide",
      subtitle: "Documentation et support",
      color: "#f39c12",
    },
  ];

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await getAuthData();
      if (!auth) {
        router.replace("/");
      }
    };
    checkAuth();
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <Text style={styles.headerSubtitle}>
          Configuration de l&apos;application
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          {settingsItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity key={item.title} style={styles.settingItem}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${item.color}20` },
                  ]}
                >
                  <IconComponent size={24} color={item.color} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                </View>
                <ExternalLink size={20} color="#ccc" />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Application de Formulaire</Text>
            <Text style={styles.infoText}>
              Cette application permet de gérer les formulaires de mission avec
              sélection de véhicules, chauffeurs et bacs via des APIs dédiées.
            </Text>
            <Text style={styles.infoVersion}>Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 50,
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  infoCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  infoVersion: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
});
