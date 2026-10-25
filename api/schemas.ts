import { z } from "zod";

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().min(0),
  is_location_offer: z.boolean(),
  is_rental: z.boolean(),
  in_stock: z.boolean(),
  is_eco_friendly: z.boolean(),
  co2_rating: z.string(),
  brand: z.object({
    id: z.string(),
    name: z.string(),
  }),
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string().optional(),
  }),
  product_image: z.object({
    id: z.string(),
    by_name: z.string(),
    by_url: z.string(),
    source_name: z.string(),
    source_url: z.string(),
    file_name: z.string(),
    title: z.string(),
  }),
});

export const productListSchema = z.object({
  current_page: z.number().int().min(1),
  data: z.array(productSchema),
  from: z.number().int().min(1).nullable(),
  last_page: z.number().int().min(1),
  per_page: z.number().int().min(1),
  to: z.number().int().min(1).nullable(),
  total: z.number().int().min(0),
});
