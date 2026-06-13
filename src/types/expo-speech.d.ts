declare module 'expo-speech' {
  export interface SpeechOptions {
    rate?: number;
    pitch?: number;
    language?: string;
    voice?: string;
    onStart?: () => void;
    onDone?: () => void;
    onStopped?: () => void;
    onError?: (error: Error) => void;
  }
  export interface Voice {
    identifier: string;
    name: string;
    quality: string;
    language: string;
  }
  export function speak(text: string, options?: SpeechOptions): void;
  export function stop(): void;
  export function pause(): void;
  export function resume(): void;
  export function isSpeakingAsync(): Promise<boolean>;
  export function getAvailableVoicesAsync(): Promise<Voice[]>;
}
