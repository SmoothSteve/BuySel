export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  read_at: string | Date | null
  created_at: string | Date | null
  bloburl: string | null
}
