export interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  fileInfo?: {
    name: string;
    type: "pdf" | "image";
  };
  selectedText?: string; // Text highlighted from PDF
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

export interface AgentContextType {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  selectedText: string;
  setSelectedText: (text: string) => void;
  pdfUrl: string | null;
  isPdfVisible: boolean;
  setIsPdfVisible: (visible: boolean) => void;
  currentChatId: string | null;
  chatHistory: ChatSession[];
  isPending: boolean;
  isUploading: boolean;
  isFileUploading: boolean;

  // Actions
  handleNewChat: () => void;
  loadChat: (chatId: string) => Promise<void>;
  sendMessage: (e?: React.FormEvent) => Promise<void>;
  processFile: (file: File) => Promise<void>;
  fileToBase64: (file: File) => Promise<string>;
}
