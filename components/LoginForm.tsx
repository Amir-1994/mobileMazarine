import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiService, getAuthData } from "../services/api";
import { LoginRequest } from "../types/api";

const { width, height } = Dimensions.get("window");

type FieldType = "username" | "password";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({
    username: false,
    password: false,
  });
  const [scaleValue] = useState(new Animated.Value(1));
  const router = useRouter();

  // Refs for handling keyboard and scroll behavior
  const scrollViewRef = useRef<ScrollView>(null);
  const passwordInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const authData = await getAuthData();
      if (authData) {
        router.push("/tabs/home");
      }
    };
    checkAuth();
  }, [router]);

  const handleFocus = (field: FieldType) => {
    setIsFocused((prev) => ({ ...prev, [field]: true }));

    // Scroll to position when input is focused (especially for smaller screens)
    if (field === "password") {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 100, animated: true });
      }, 100);
    }
  };

  const handleBlur = (field: FieldType) => {
    setIsFocused((prev) => ({ ...prev, [field]: false }));
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    dismissKeyboard(); // Dismiss keyboard when login is pressed
    animateButton();

    if (!username || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const credentials: LoginRequest = { login: username, password };
      const response = await apiService.login(credentials);
      if (response.success) {
        Alert.alert("Success", "Login successful!");
        router.push("/tabs/home");
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

  const focusPasswordField = () => {
    passwordInputRef.current?.focus();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.fullScreen}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.backgroundGradient}
        >
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              bounces={false} // Prevent bounce effect that can cause visual issues
              overScrollMode="never" // Prevent overscroll glow on Android
            >
              {/* Header Section */}
              <View style={styles.header}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>
              </View>

              {/* Form Section */}
              <View style={styles.formCard}>
                {/* Username Field */}
                <View
                  style={[
                    styles.inputContainer,
                    isFocused.username && styles.inputContainerFocused,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={isFocused.username ? "#667eea" : "#999"}
                    style={styles.icon}
                  />
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter your username"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    onFocus={() => handleFocus("username")}
                    onBlur={() => handleBlur("username")}
                    editable={!loading}
                    returnKeyType="next"
                    onSubmitEditing={focusPasswordField} // Move to password field on enter
                    blurOnSubmit={false}
                  />
                </View>

                {/* Password Field */}
                <View
                  style={[
                    styles.inputContainer,
                    isFocused.password && styles.inputContainerFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={isFocused.password ? "#667eea" : "#999"}
                    style={styles.icon}
                  />
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    onFocus={() => handleFocus("password")}
                    onBlur={() => handleBlur("password")}
                    editable={!loading}
                    returnKeyType="go"
                    onSubmitEditing={handleLogin} // Submit form on enter
                  />
                </View>

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* Login Button */}
                <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    activeOpacity={0.9}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={["#667eea", "#764ba2"]}
                      style={styles.gradientButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.buttonText}>Sign In</Text>
                          <Ionicons
                            name="arrow-forward"
                            size={20}
                            color="#fff"
                          />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Dont have an account? </Text>
                  <TouchableOpacity>
                    <Text style={styles.signupLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer Spacer for small screens */}
              <View style={styles.footerSpacer} />
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  backgroundGradient: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    minHeight: height,
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 30,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputContainerFocused: {
    borderColor: "#667eea",
    backgroundColor: "#fff",
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#333",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: "#667eea",
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 10,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  signupText: {
    color: "#666",
    fontSize: 14,
  },
  signupLink: {
    color: "#667eea",
    fontSize: 14,
    fontWeight: "600",
  },
  footerSpacer: {
    height: 40,
  },
});
