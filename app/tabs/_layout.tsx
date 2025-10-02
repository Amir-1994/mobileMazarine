import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useOfflineForms } from "@/hooks/useOfflineForms";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const { t } = useTranslation();

  let { offlineFormsCount } = useOfflineForms();

  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Offline Forms Count:", offlineFormsCount);
    }, 500);

    return () => clearInterval(intervalId);
  }, [offlineFormsCount]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          paddingBottom: 2,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          textAlign: "center",
        },
        tabBarIconStyle: {
          marginTop: 2,
          alignSelf: "center",
        },
        tabBarItemStyle: {
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("HOME"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="offline-forms"
        options={{
          title: t("OFFLINE_FORMS"),
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="notifications" color={color} size={size} />
              {offlineFormsCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    right: -6,
                    top: -3,
                    backgroundColor: "red",
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Ionicons
                    name="notifications"
                    size={10}
                    color="white"
                    style={{ fontSize: 10, fontWeight: "bold" }}
                  />
                </View>
              )}
            </View>
          ),
          tabBarBadge: offlineFormsCount > 0 ? offlineFormsCount : undefined,
        }}
      />
    </Tabs>
  );
}
