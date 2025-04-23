import { Firearm, FirearmInput } from "../types/firearm";
import { Platform } from "react-native";

// Determine the correct API URL based on the platform
let API_URL = "";
if (Platform.OS === "android") {
  // For Android emulator
  API_URL = "http://10.0.2.2:3000/api";
} else if (Platform.OS === "ios") {
  // For iOS simulator or Expo Go on physical device
  // Use your computer's local IP address when using Expo Go on a physical device
  API_URL = "http://192.168.0.78:3000/api"; // Replace with your actual IP address
}

console.log("Using API URL:", API_URL);

const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

// Helper function to handle fetch with timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout = 10000
) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export const api = {
  // Get all firearms
  getFirearms: async (): Promise<Firearm[]> => {
    try {
      console.log("Making API request to:", `${API_URL}/firearms`);

      const response = await fetchWithTimeout(
        `${API_URL}/firearms`,
        {
          method: "GET",
          headers: defaultHeaders,
        },
        10000 // 10 second timeout
      );
      console.log("API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error response:", errorText);
        throw new Error(
          `Failed to fetch firearms: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();
      console.log("API Response data:", data);

      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid response format: expected an array of firearms"
        );
      }

      return data;
    } catch (error) {
      console.error("Error fetching firearms:", error);
      if (error instanceof TypeError) {
        if (error.message === "Network request failed") {
          throw new Error(
            "Cannot connect to the server. Please check if the server is running and accessible."
          );
        } else if (error.name === "AbortError") {
          throw new Error(
            "Request timed out. Please check your connection and try again."
          );
        }
      }
      throw error;
    }
  },

  // Get a single firearm
  getFirearm: async (id: string): Promise<Firearm> => {
    try {
      const response = await fetch(`${API_URL}/firearms/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch firearm");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching firearm:", error);
      throw error;
    }
  },

  // Create a new firearm
  createFirearm: async (firearm: FirearmInput) => {
    const formData = new FormData();
    formData.append("modelName", firearm.modelName);
    formData.append("caliber", firearm.caliber);
    formData.append("datePurchased", firearm.datePurchased.toISOString());
    formData.append("amountPaid", firearm.amountPaid.toString());
    if (firearm.photos) {
      firearm.photos.forEach((photo, index) => {
        formData.append("photos", {
          uri: photo,
          type: "image/jpeg",
          name: `photo${index}.jpg`,
        } as any);
      });
    }

    const response = await fetch(`${API_URL}/firearms`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to create firearm");
    }

    return response.json();
  },

  // Update a firearm
  updateFirearm: async (id: string, firearm: FirearmInput) => {
    const formData = new FormData();
    formData.append("modelName", firearm.modelName);
    formData.append("caliber", firearm.caliber);
    formData.append("datePurchased", firearm.datePurchased.toISOString());
    formData.append("amountPaid", firearm.amountPaid.toString());
    if (firearm.photos) {
      firearm.photos.forEach((photo, index) => {
        formData.append("photos", {
          uri: photo,
          type: "image/jpeg",
          name: `photo${index}.jpg`,
        } as any);
      });
    }

    const response = await fetch(`${API_URL}/firearms/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to update firearm");
    }

    return response.json();
  },

  // Delete a firearm
  deleteFirearm: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/firearms/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete firearm");
      }
    } catch (error) {
      console.error("Error deleting firearm:", error);
      throw error;
    }
  },

  // Get statistics
  getStats: async (): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/firearms/stats/overview`);
      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching statistics:", error);
      throw error;
    }
  },
};
