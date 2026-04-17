export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  read_at: Date | null
  created_at: Date
  bloburl: string|null
}
