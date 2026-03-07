export type ItemStatus = "available" | "claimed" | "pending" | string;

export interface LatestItem {
  item_id: number;
  title: string;
  description?: string;
  image_url?: string;
  category_name?: string;
  pickup_location?: string;
  status?: ItemStatus;
}