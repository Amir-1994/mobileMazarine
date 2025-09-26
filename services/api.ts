import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Asset,
  Driver,
  Bac,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  AuthData,
} from "@/types/api";

const API_BASE_URL = "http://localhost:8000/api/v1.0";

// Helper functions for token management
export const setAuthData = async (authData: AuthData): Promise<void> => {
  try {
    await AsyncStorage.setItem("authData", JSON.stringify(authData));
  } catch (error) {
    console.error("Error saving auth data:", error);
  }
};

export const getAuthData = async (): Promise<AuthData | null> => {
  try {
    const data = await AsyncStorage.getItem("authData");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting auth data:", error);
    return null;
  }
};

export const removeAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("authData");
  } catch (error) {
    console.error("Error removing auth data:", error);
  }
};

export const apiService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        throw new Error("Login failed");
      }
      const data: LoginResponse = await response.json();
      if (data.success) {
        await setAuthData(data.result);
      }
      return data;
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  },

  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    console.log("Logout function called"); // Debugging line
    try {
      const authData = await getAuthData();
      if (!authData) {
        throw new Error("No auth data found");
      }
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      const data: LogoutResponse = await response.json();
      if (data.success) {
        await removeAuthData();
      }
      return data;
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  },
  async getAssets(): Promise<Asset[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/assets`);
      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching assets:", error);
      // Return mock data for development
      return [
        {
          id: "1",
          name: "Camion Mercedes Actros",
          type: "Truck",
          licensePlate: "AB-123-CD",
        },
        {
          id: "2",
          name: "Fourgon Renault Master",
          type: "Van",
          licensePlate: "EF-456-GH",
        },
        {
          id: "3",
          name: "Tracteur Volvo FH",
          type: "Tractor",
          licensePlate: "IJ-789-KL",
        },
        {
          id: "4",
          name: "Camionnette Ford Transit",
          type: "Light Truck",
          licensePlate: "MN-012-OP",
        },
      ];
    }
  },

  async getDrivers(): Promise<Driver[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`);
      if (!response.ok) {
        throw new Error("Failed to fetch drivers");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching drivers:", error);
      // Return mock data for development
      return [
        {
          id: "1",
          name: "Jean Dupont",
          firstName: "Jean",
          lastName: "Dupont",
          email: "jean.dupont@email.com",
          phone: "0123456789",
        },
        {
          id: "2",
          name: "Marie Martin",
          firstName: "Marie",
          lastName: "Martin",
          email: "marie.martin@email.com",
          phone: "0987654321",
        },
        {
          id: "3",
          name: "Pierre Durand",
          firstName: "Pierre",
          lastName: "Durand",
          email: "pierre.durand@email.com",
          phone: "0147258369",
        },
        {
          id: "4",
          name: "Sophie Bernard",
          firstName: "Sophie",
          lastName: "Bernard",
          email: "sophie.bernard@email.com",
          phone: "0369258147",
        },
      ];
    }
  },

  async getBacs(queryBody: Record<string, unknown>): Promise<Bac[]> {
    try {
      if (!queryBody || typeof queryBody !== "object") {
        throw new Error("Invalid query body");
      }

      const response = await fetch(`${API_BASE_URL}/geodata/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryBody),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch bacs");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching bacs:", error);
      // Return mock data for development
      return [
        {
          id: "1",
          name: "Bac Nord Paris",
          location: "Paris Nord",
          capacity: 1000,
          type: "Standard",
        },
        {
          id: "2",
          name: "Bac Sud Lyon",
          location: "Lyon Sud",
          capacity: 1500,
          type: "Large",
        },
        {
          id: "3",
          name: "Bac Est Marseille",
          location: "Marseille Est",
          capacity: 800,
          type: "Compact",
        },
        {
          id: "4",
          name: "Bac Ouest Toulouse",
          location: "Toulouse Ouest",
          capacity: 1200,
          type: "Standard",
        },
      ];
    }
  },
};
