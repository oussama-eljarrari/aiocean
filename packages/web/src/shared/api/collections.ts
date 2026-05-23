import { get, post, patch, del } from "./client"

export interface Collection {
  id: string
  name: string
  is_public: boolean
  tool_count: number
  created_at: string
}

export async function getCollections(): Promise<Collection[]> {
  const data = await get<{ collections: Collection[] }>("/collections")
  return data.collections
}

export async function createCollection(name: string, isPublic: boolean): Promise<Collection> {
  const data = await post<{ collection: Collection }>("/collections", { name, is_public: isPublic })
  return data.collection
}

export async function updateCollection(id: string, payload: { name?: string; is_public?: boolean }): Promise<Collection> {
  const data = await patch<{ collection: Collection }>(`/collections/${id}`, payload)
  return data.collection
}

export async function deleteCollection(id: string): Promise<void> {
  await del(`/collections/${id}`)
}

export async function addToolToCollection(collectionId: string, toolId: string): Promise<Collection> {
  const data = await post<{ collection: Collection }>(`/collections/${collectionId}/tools`, { tool_id: toolId })
  return data.collection
}

export async function removeToolFromCollection(collectionId: string, toolId: string): Promise<Collection> {
  const data = await del<{ collection: Collection }>(`/collections/${collectionId}/tools`, { tool_id: toolId })
  return data.collection
}
