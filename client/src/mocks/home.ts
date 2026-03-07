import type { LatestItem } from "../types/item";

export const mockLatestItems: LatestItem[] = [
  {
    item_id: 1,
    title: "Baby Stroller",
    description: "Clean and gently used stroller for newborns.",
    image_url: "/images/hero.jpg",
    category_name: "Baby Needs",
    pickup_location: "Brooklyn, NY",
    status: "available",
  },
  {
    item_id: 2,
    title: "Winter Jackets",
    description: "A bundle of winter jackets in good condition.",
    image_url: "/images/jacket.jpg",
    category_name: "Clothes",
    pickup_location: "Queens, NY",
    status: "available",
  },
  {
    item_id: 3,
    title: "School Books",
    description: "Math and science books for middle school students.",
    category_name: "Books",
    pickup_location: "Bronx, NY",
    status: "claimed",
  },
  {
    item_id: 4,
    title: "Rice and Canned Goods",
    description: "Extra pantry items available for pickup.",
    category_name: "Food",
    pickup_location: "Manhattan, NY",
    status: "available",
  },
];