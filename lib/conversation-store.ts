import type { ConversationState } from "@/types/chat"

class ConversationStore {
  private conversations: Map<string, ConversationState> = new Map()

  get(conversationId: string): ConversationState | undefined {
    return this.conversations.get(conversationId)
  }

  save(conversationId: string, state: ConversationState): void {
    this.conversations.set(conversationId, state)
  }

  delete(conversationId: string): boolean {
    return this.conversations.delete(conversationId)
  }

  clear(): void {
    this.conversations.clear()
  }
}

export const conversationStore = new ConversationStore()
