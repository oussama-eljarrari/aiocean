import { get, post } from "./client"

export interface Review {
  id: string
  tool_id: string
  rating: number
  comment: string
  created_at: string
  updated_at: string
  author: {
    id: string
    name: string
    pfp_url: string | null
  }
}

export async function getReviews(toolId: string): Promise<Review[]> {
  const data = await get<{ reviews: Review[] }>(`/tools/${toolId}/reviews`)
  return data.reviews
}

export async function upsertReview(toolId: string, rating: number, comment: string): Promise<Review> {
  const data = await post<{ review: Review }>(`/tools/${toolId}/reviews`, { rating, comment })
  return data.review
}
