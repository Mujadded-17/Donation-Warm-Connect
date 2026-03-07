import axios from "axios";
import type { LatestItem } from "../types/item";
import { mockLatestItems } from "../mocks/home";
import { secrets } from "../secrets";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

interface LatestItemsResponse {
  success: boolean;
  message?: string;
  data?: LatestItem[];
}

export async function getLatestItems(limit = 8): Promise<LatestItem[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockLatestItems.slice(0, limit);
  }

  const response = await axios.get<LatestItemsResponse>(
    `${secrets.backendEndpoint}/items_list.php?limit=${limit}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to load items");
  }

  return response.data.data || [];
}