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

//const API_BASE_URL = "http://localhost:8000/api/v1.0";

const API_BASE_URL = "https://demo.ngi-gps.com/apimobile/v1.0";
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
      console.log("Login response data:", data);
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
      console.log("Fetch assets response:", response);
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

  async queryAssets(term?: string): Promise<Asset[]> {
    const authData = await getAuthData();

    if (!authData) {
      throw new Error("No auth data found");
    }

    const body: any = {
      query: {
        _company_owner: authData.user._company_owner._id,
      },
      options: {
        populate: [{ path: "_asset", select: "name" }],
        sortBy: { from_dt: -1 },
      },
    };

    // only add regex filter if term is provided
    if (term && term.trim().length > 0) {
      body.query.$or = [
        { name: { $regex: term, $options: "i" } },
        { licensePlate: { $regex: term, $options: "i" } },
      ];
    }

    const response = await fetch(
      `${API_BASE_URL}/asset/query?limit=10&page=1`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to query assets");
    }
    const data = await response.json();
    return data.result || [];
  },

  async getDrivers(): Promise<Driver[]> {
    console.log("Fetching drivers from API...");
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

  async queryDrivers(term?: string): Promise<Driver[]> {
    console.log("Fetching drivers from API...");

    const authData = await getAuthData();

    if (!authData) {
      throw new Error("No auth data found");
    }

    const body: any = {
      query: {
        _company_owner: authData.user._company_owner._id,
      },
      options: {
        sortBy: { from_dt: -1 }, // adjust if backend expects "from_dt:desc"
      },
    };

    // only add regex filter if term is provided
    if (term && term.trim().length > 0) {
      body.query.$or = [
        { first_name: { $regex: term, $options: "i" } },
        { last_name: { $regex: term, $options: "i" } },
      ];
    }

    const response = await fetch(
      `${API_BASE_URL}/driver/query?limit=10&page=1`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to query drivers");
    }

    const data = await response.json();
    const drivers = (data.result as any[]) || [];
    return drivers.map((driver: any) => ({
      id: driver._id || driver.id,
      name: `${driver.first_name || ""} ${driver.last_name || ""}`.trim(),
      firstName: driver.first_name,
      lastName: driver.last_name,
      email: driver.email,
      phone: driver.phone,
    })) as Driver[];
  },

  async queryBacs(term?: string): Promise<Bac[]> {
    const authData = await getAuthData();

    if (!authData) {
      throw new Error("No auth data found");
    }

    const body: any = {
      query: {
        _company_owner: authData.user._company_owner._id,
        "geometry.type": "Point",
      },
      options: {
        sortBy: { creation_dt: -1 },
      },
    };

    // only add regex filter if term is provided
    if (term && term.trim().length > 0) {
      body.query["properties.Nom"] = { $regex: term, $options: "i" };
    }

    const response = await fetch(
      `${API_BASE_URL}/geodata/query?limit=10&page=1`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to query bacs");
    }

    const data = await response.json();
    console.log("Fetch bacs response:00001", data.result);

    const bacs = (data.result as any[]) || [];
    return bacs.map((bac: any) => ({
      id: bac._id,
      name: bac.properties?.Nom || "Unnamed",
      location: bac.properties?.Description || "",
      capacity: bac.properties?.capacity || 0,
      type: bac.category || "Point",
    })) as Bac[];
  },

  async saveFormData(formData: any): Promise<any> {
    console.log("Saving form data to API...", formData);
    if ("title" in formData) {
      delete formData.title;
    }
    console.log("after delete title", formData);
    const authData = await getAuthData();

    if (!authData) {
      throw new Error("No auth data found");
    }

    const response = await fetch(`${API_BASE_URL}/form_data/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authData.token}`,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error("Failed to save form data");
    }

    return await response.json();
  },

  async queryForms(limit: number = 10, page: number = 1): Promise<any[]> {
    const authData = await getAuthData();

    if (!authData) {
      throw new Error("No auth data found");
    }

    const body: any = {
      query: {
        //_company_owner: authData.user._company_owner._id,
      },
      options: {
        sortBy: { createdAt: -1 },
      },
    };

    const response = await fetch(
      `${API_BASE_URL}/form/query?limit=${limit}&page=${page}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to query forms");
    }

    const data = await response.json();
    return data.result || [];
  },
};
