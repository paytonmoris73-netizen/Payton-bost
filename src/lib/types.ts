export interface Revision {
  id: number;
  prompt: string;
  status: "streaming" | "done" | "error";
  note?: string;
  error?: string;
}

export interface Config {
  model: string;
  hasApiKey: boolean;
}
