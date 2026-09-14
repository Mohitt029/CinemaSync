// src/services/chat.service.ts
import axios from 'axios';
import { Event } from '../types/event.types';

const API_BASE = process.env.REACT_APP_EVENT_API_URL || 'http://localhost:8082/api';

export interface ChatResponse {
  reply: string;
  events: Event[];
  source: 'openai' | 'rules';
}

class ChatService {
  private api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
  });

  async send(message: string): Promise<ChatResponse> {
    const { data } = await this.api.post<ChatResponse>('/chat', { message });
    // Normalize single event object from some proxies
    const events = Array.isArray(data.events)
      ? data.events
      : data.events
        ? [data.events as unknown as Event]
        : [];
    return { ...data, events };
  }
}

export default new ChatService();