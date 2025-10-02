import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FormData } from "@/types/api";

export interface OfflineForm {
  id: string;
  title?: string;
  data: FormData;
  timestamp: number;
}

interface OfflineFormsContextType {
  offlineForms: OfflineForm[];
  offlineFormsCount: number;
  saveOfflineForm: (formData: any) => Promise<void>;
  deleteOfflineForm: (id: string) => Promise<void>;
  updateOfflineForm: (id: string, newData: any) => Promise<void>;
  clearOfflineForms: () => Promise<void>;
  loadOfflineForms: () => Promise<void>;
}

const OfflineFormsContext = createContext<OfflineFormsContextType | undefined>(
  undefined
);

const OFFLINE_FORMS_KEY = "offline_forms";

export const OfflineFormsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [offlineForms, setOfflineForms] = useState<OfflineForm[]>([]);
  const [offlineFormsCount, setOfflineFormsCount] = useState(0);

  const loadOfflineForms = async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_FORMS_KEY);
      if (stored) {
        const forms = JSON.parse(stored);
        setOfflineForms(forms);
        setOfflineFormsCount(forms.length);
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
      const updated = offlineForms.filter((form) => form.id !== id);
      await AsyncStorage.setItem(OFFLINE_FORMS_KEY, JSON.stringify(updated));
      setOfflineForms(updated);
      setOfflineFormsCount(updated.length);
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

  return (
    <OfflineFormsContext.Provider
      value={{
        offlineForms,
        offlineFormsCount,
        saveOfflineForm,
        deleteOfflineForm,
        updateOfflineForm,
        clearOfflineForms,
        loadOfflineForms,
      }}
    >
      {children}
    </OfflineFormsContext.Provider>
  );
};

export const useOfflineForms = () => {
  const context = useContext(OfflineFormsContext);
  if (!context) {
    throw new Error(
      "useOfflineForms must be used within an OfflineFormsProvider"
    );
  }
  return context;
};
