import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginForm from "../components/LoginForm";
import Onboarding from "../components/Onboarding";

export default function Index() {
  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem("onboardingCompleted");
        setOnboardingCompleted(completed === "true");
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setOnboardingCompleted(false);
      }
    };
    checkOnboarding();
  }, []);

  if (onboardingCompleted === null) {
    // Loading state
    return null;
  }

  if (!onboardingCompleted) {
    return <Onboarding onComplete={() => setOnboardingCompleted(true)} />;
  }

  return <LoginForm />;
}
