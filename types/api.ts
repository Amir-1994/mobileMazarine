export interface Asset {
  id: string;
  name: string;
  type?: string;
  model?: string;
  licensePlate?: string;
}

export interface Driver {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface Bac {
  id: string;
  name: string;
  location?: string;
  capacity?: number;
  type?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

export interface User {
  _id: string;
  first_name: string;
  last_name: string;
  login: string;
  role: string;
  creation_dt: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  result: {
    user: User;
    token: string;
  };
}

export interface LogoutRequest {
  id: string;
}

export interface LogoutResponse {
  success: boolean;
}

export interface AuthData {
  user: User;
  token: string;
}

export interface FormData {
  selectedAsset: Asset | null;
  selectedDriver: Driver | null;
  selectedBac: Bac | null;
  photo: string | null;
  description: string;
  location: Location | null;
}
