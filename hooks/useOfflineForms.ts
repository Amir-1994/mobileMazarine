import { FormData } from "@/types/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";

export interface OfflineForm {
  id: string;
  title?: string;
  data: FormData;
  timestamp: number;
}

const OFFLINE_FORMS_KEY = "offline_forms";

export const useOfflineForms = () => {
  const [offlineForms, setOfflineForms] = useState<OfflineForm[]>([]);
  const [offlineFormsCount, setOfflineFormsCount] = useState(0);

  const loadOfflineForms = async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_FORMS_KEY);
      if (stored) {
        const forms = JSON.parse(stored);
        setOfflineForms(forms);
        let legnthForms = forms.length;
        legnthForms++;
        setOfflineFormsCount(legnthForms);
      }
    } catch (error) {
      console.error("Error loading offline forms:", error);
    }
  };

  const saveOfflineForm = async (formData: any) => {
    try {
      const newForm: OfflineForm = {
        id: Date.now().toString(),
        title: formData.title,

        data: formData,
        timestamp: Date.now(),
      };
      const updatedForms = [...offlineForms, newForm];
      await AsyncStorage.setItem(
        OFFLINE_FORMS_KEY,
        JSON.stringify(updatedForms)
      );
      setOfflineForms(updatedForms);
      setOfflineFormsCount(updatedForms.length);
    } catch (error) {
      console.error("Error saving offline form:", error);
    }
  };

  const deleteOfflineForm = async (id: string) => {
    try {
      setOfflineForms((prev) => {
        const updated = prev.filter((form) => form.id !== id);
        AsyncStorage.setItem(OFFLINE_FORMS_KEY, JSON.stringify(updated));
        return updated;
      });
      setOfflineFormsCount((prev) => prev - 1);
    } catch (error) {
      console.error("Error deleting offline form:", error);
    }
  };

  const updateOfflineForm = async (id: string, newData: any) => {
    try {
      const updatedForms = offlineForms.map((form) =>
        form.id === id ? { ...form, data: newData } : form
      );
      await AsyncStorage.setItem(
        OFFLINE_FORMS_KEY,
        JSON.stringify(updatedForms)
      );
      setOfflineForms(updatedForms);
    } catch (error) {
      console.error("Error updating offline form:", error);
    }
  };

  const clearOfflineForms = async () => {
    try {
      await AsyncStorage.removeItem(OFFLINE_FORMS_KEY);
      setOfflineForms([]);
      setOfflineFormsCount(0);
    } catch (error) {
      console.error("Error clearing offline forms:", error);
    }
  };

  useEffect(() => {
    loadOfflineForms();
  }, []);

  return {
    offlineForms,
    offlineFormsCount,
    saveOfflineForm,
    deleteOfflineForm,
    updateOfflineForm,
    clearOfflineForms,
    loadOfflineForms,
  };
};
