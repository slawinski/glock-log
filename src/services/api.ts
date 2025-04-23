import { Firearm, FirearmInput } from "../types/firearm";
import { Platform } from "react-native";
import { RangeVisit, RangeVisitInput } from "../types/rangeVisit";
import { RangeVisitStats } from "../types/rangeVisitStats";

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
      console.log("Making API request to:", `${API_URL}/firearms/${id}`);

      const response = await fetchWithTimeout(
        `${API_URL}/firearms/${id}`,
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
          `Failed to fetch firearm: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();
      console.log("API Response data:", data);

      return data;
    } catch (error) {
      console.error("Error fetching firearm:", error);
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

  // Get all range visits
  getRangeVisits: async (): Promise<RangeVisit[]> => {
    try {
      const response = await fetch(`${API_URL}/range-visits`);
      if (!response.ok) {
        throw new Error("Failed to fetch range visits");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching range visits:", error);
      throw error;
    }
  },

  // Get a single range visit
  getRangeVisit: async (id: string): Promise<RangeVisit> => {
    try {
      const response = await fetch(`${API_URL}/range-visits/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch range visit");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching range visit:", error);
      throw error;
    }
  },

  // Create a new range visit
  createRangeVisit: async (visit: RangeVisitInput) => {
    console.log("Creating range visit with data:", visit);

    const formData = new FormData();
    formData.append("date", visit.date.toISOString());
    formData.append("location", visit.location);
    if (visit.notes) {
      formData.append("notes", visit.notes);
    }
    formData.append("firearmsUsed", JSON.stringify(visit.firearmsUsed));
    formData.append("roundsFired", visit.roundsFired.toString());
    if (visit.photos) {
      visit.photos.forEach((photo, index) => {
        formData.append("photos", {
          uri: photo,
          type: "image/jpeg",
          name: `photo${index}.jpg`,
        } as any);
      });
    }

    console.log("Sending form data:", {
      date: visit.date.toISOString(),
      location: visit.location,
      notes: visit.notes,
      firearmsUsed: JSON.stringify(visit.firearmsUsed),
      roundsFired: visit.roundsFired.toString(),
      photosCount: visit.photos?.length || 0,
    });

    try {
      const response = await fetch(`${API_URL}/range-visits`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from server:", errorText);
        throw new Error(
          `Server error (${response.status}): ${
            errorText || "No error message provided"
          }`
        );
      }

      const data = await response.json();
      console.log("Successfully created range visit:", data);
      return data;
    } catch (error) {
      console.error("Error in createRangeVisit:", error);
      if (
        error instanceof TypeError &&
        error.message === "Network request failed"
      ) {
        throw new Error(
          "Cannot connect to the server. Please check:\n" +
            "1. The server is running\n" +
            "2. Your network connection\n" +
            "3. The API URL is correct (currently: " +
            API_URL +
            ")"
        );
      }
      throw error;
    }
  },

  // Update a range visit
  updateRangeVisit: async (id: string, visit: RangeVisitInput) => {
    const formData = new FormData();
    formData.append("date", visit.date.toISOString());
    formData.append("location", visit.location);
    if (visit.notes) {
      formData.append("notes", visit.notes);
    }
    formData.append("firearmsUsed", JSON.stringify(visit.firearmsUsed));
    formData.append("roundsFired", visit.roundsFired.toString());
    if (visit.photos) {
      visit.photos.forEach((photo, index) => {
        formData.append("photos", {
          uri: photo,
          type: "image/jpeg",
          name: `photo${index}.jpg`,
        } as any);
      });
    }

    const response = await fetch(`${API_URL}/range-visits/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to update range visit");
    }

    return response.json();
  },

  // Delete a range visit
  deleteRangeVisit: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/range-visits/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete range visit");
      }
    } catch (error) {
      console.error("Error deleting range visit:", error);
      throw error;
    }
  },

  // Get range visit statistics
  getRangeVisitStats: async (): Promise<RangeVisitStats> => {
    try {
      const response = await fetch(`${API_URL}/range-visits/stats/overview`);
      if (!response.ok) {
        throw new Error("Failed to fetch range visit statistics");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching range visit statistics:", error);
      throw error;
    }
  },
};
