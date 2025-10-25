import AsyncStorage from "@react-native-async-storage/async-storage";

const MESSAGE_QUEUE_KEY = "@message_queue";
const MAX_QUEUE_SIZE = 100;

export interface QueuedMessage {
  id: string;
  conversationId: string;
  content: string;
  imageId?: string;
  timestamp: number;
  attempts: number;
}

export class MessageQueue {
  // Add message to queue
  static async enqueue(
    message: Omit<QueuedMessage, "id" | "timestamp" | "attempts">,
  ): Promise<void> {
    try {
      const queue = await this.getQueue();

      const queuedMessage: QueuedMessage = {
        ...message,
        id: `${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        attempts: 0,
      };

      // Add to queue (FIFO)
      queue.push(queuedMessage);

      // Limit queue size
      if (queue.length > MAX_QUEUE_SIZE) {
        queue.shift(); // Remove oldest
      }

      await AsyncStorage.setItem(MESSAGE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error("Error enqueueing message:", error);
    }
  }

  // Get all queued messages
  static async getQueue(): Promise<QueuedMessage[]> {
    try {
      const queueJson = await AsyncStorage.getItem(MESSAGE_QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error("Error getting queue:", error);
      return [];
    }
  }

  // Remove message from queue
  static async dequeue(messageId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter((msg) => msg.id !== messageId);
      await AsyncStorage.setItem(MESSAGE_QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error dequeueing message:", error);
    }
  }

  // Increment attempt count
  static async incrementAttempts(messageId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const updated = queue.map((msg) =>
        msg.id === messageId ? { ...msg, attempts: msg.attempts + 1 } : msg,
      );
      await AsyncStorage.setItem(MESSAGE_QUEUE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error incrementing attempts:", error);
    }
  }

  // Clear entire queue
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(MESSAGE_QUEUE_KEY);
    } catch (error) {
      console.error("Error clearing queue:", error);
    }
  }

  // Get queue size
  static async size(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }
}
