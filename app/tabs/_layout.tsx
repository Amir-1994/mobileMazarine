import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  Modal,
  Pressable,
  Alert,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuthData, removeAuthData, apiService } from "@/services/api";
import { User } from "@/types/api";

export default function TabLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const auth = await getAuthData();
      if (auth) {
        setUser(auth.user);
      }
    };
    fetchUser();
  }, []);

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
      setUser(null);
      router.replace("/");
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerTitle: "",
          headerLeft: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginRight: 16 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              {user ? (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onPress={() => setShowLogoutModal(true)}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={40}
                    color="#000"
                  />
                  <Text style={{ fontSize: 16, fontWeight: "600" }}>
                    {user.first_name}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ),
        }}
      >
        <Tabs.Screen name="home" options={{ title: "" }} />
        <Tabs.Screen name="settings" options={{ title: "" }} />
      </Tabs>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
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
    </>
  );
}
