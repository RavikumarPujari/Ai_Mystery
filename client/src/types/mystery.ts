export interface ChatMessage {
  id: string;
  senderName: string;
  timestamp: string;
  text: string;
}

export interface ChatEvidenceContent {
  conversationId: string;
  channelName: string;
  participants: string[];
  messages: ChatMessage[];
  disclaimer: string;
}

export interface CctvFrame {
  frameId: string;
  timestamp: string;
  cameraLocation: string;
  cameraTag: string;
  description: string;
  observedEntities: string[];
  imageUrl?: string;
}

export interface CctvEvidenceContent {
  cameraTag: string;
  location: string;
  timeRange: string;
  frames: CctvFrame[];
  surveillanceLog: string;
  disclaimer: string;
}

