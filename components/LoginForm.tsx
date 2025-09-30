import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiService, getAuthData } from "../services/api";
import { LoginRequest, User } from "../types/api";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverLabel, setServerLabel] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const router = useRouter();

  const [language, setLanguage] = useState("en");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [loggedUsers, setLoggedUsers] = useState<
    { user: User; password: string }[]
  >([]);

  useEffect(() => {
    const loadLoggedUsers = async () => {
      try {
        const users = await AsyncStorage.getItem("loggedUsers");
        if (users) {
          setLoggedUsers(JSON.parse(users));
        }
      } catch (error) {
        console.error("Error loading logged users:", error);
      }
    };
    loadLoggedUsers();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const credentials: LoginRequest = { login: username, password };
      const response = await apiService.login(credentials);
      if (response.success) {
        const user = response.result.user;
        const userExists = loggedUsers.some((u) => u.user._id === user._id);
        if (!userExists) {
          const updatedUsers = [...loggedUsers, { user, password }];
          setLoggedUsers(updatedUsers);
          AsyncStorage.setItem("loggedUsers", JSON.stringify(updatedUsers));
        }
        router.push("/form-list");
      } else {
        Alert.alert("Error", "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowServerModal(true)}
        >
          <Ionicons name="settings" size={30} color="#333" />
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Image
          source={require("../assets/images/adaptive-favicon.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowBottomSheet(true)}
          >
            <Text style={styles.dropdownText}>
              {selectedUser
                ? `${selectedUser.first_name || selectedUser.login} ${
                    selectedUser.last_name || ""
                  }`.trim()
                : "Select User"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#333" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          editable={!loading}
          onSubmitEditing={handleLogin}
        />

        <View style={styles.flagsContainer}>
          <TouchableOpacity
            style={[styles.flag, language === "fr" && styles.flagSelected]}
            onPress={() => setLanguage("fr")}
          >
            <Text style={styles.flagText}>🇫🇷</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.flag, language === "en" && styles.flagSelected]}
            onPress={() => setLanguage("en")}
          >
            <Text style={styles.flagText}>🇬🇧</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showServerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowServerModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowServerModal(false)}
        >
          <Pressable style={styles.serverModal} onPress={() => {}}>
            <Text style={styles.modalTitle}>Paramètres serveur</Text>
            <TextInput
              style={styles.modalInput}
              value={serverLabel}
              onChangeText={setServerLabel}
              placeholder="Label"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.modalInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="URL"
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowServerModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  // Save server settings
                  Alert.alert("Succès", "Paramètres serveur sauvegardés");
                  setShowServerModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showBottomSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBottomSheet(false)}
      >
        <Pressable
          style={styles.bottomSheetOverlay}
          onPress={() => setShowBottomSheet(false)}
        >
          <View style={styles.bottomSheet}>
            {loggedUsers.filter((item) => item.user && item.user.login).length >
            0 ? (
              loggedUsers
                .filter((item) => item.user && item.user.login)
                .map((item) => (
                  <TouchableOpacity
                    key={item.user._id}
                    style={styles.bottomSheetItem}
                    onPress={() => {
                      setSelectedUser(item.user);
                      setUsername(item.user.login);
                      setPassword(item.password);
                      setShowBottomSheet(false);
                    }}
                  >
                    <View style={styles.bottomSheetItemContent}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>
                          {(item.user.first_name || item.user.login)
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.bottomSheetItemText}>
                        {`${item.user.first_name || item.user.login} ${
                          item.user.last_name || ""
                        }`.trim()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
            ) : (
              <Text style={styles.bottomSheetItemText}>No logged in users</Text>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F0",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    width: "100%",
  },
  input: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C2A68C",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#5D866C",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
  footerLink: {
    color: "#5D866C",
    fontSize: 14,
    fontWeight: "600",
  },
  topBar: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  serverModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#F5F5F0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#C2A68C",
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: "#5D866C",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    backgroundColor: "#C2A68C",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdown: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C2A68C",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  flagsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    gap: 16,
  },
  flag: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C2A68C",
    backgroundColor: "#fff",
  },
  flagSelected: {
    backgroundColor: "#5D866C",
  },
  flagText: {
    fontSize: 24,
  },
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheetHeader: {
    backgroundColor: "#5D866C",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  closeButton: {
    padding: 4,
  },
  bottomSheet: {
    backgroundColor: "#fff",
    padding: 20,
    maxHeight: "50%",
    minHeight: Dimensions.get("window").height / 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetItem: {
    paddingVertical: 12,
  },
  bottomSheetItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#5D866C",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  bottomSheetItemText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
});
