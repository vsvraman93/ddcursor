/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_URL: string;
  readonly VITE_API_URL: string;
  readonly VITE_MAX_FILE_SIZE: string;
  readonly VITE_ALLOWED_FILE_TYPES: string;
  readonly VITE_SESSION_DURATION: string;
  readonly VITE_MAX_LOGIN_ATTEMPTS: string;
  readonly VITE_LOCKOUT_DURATION: string;
  readonly VITE_ENABLE_REALTIME: string;
  readonly VITE_ENABLE_FILE_PREVIEW: string;
  readonly VITE_ENABLE_NOTIFICATIONS: string;
  readonly VITE_DEV_MODE: string;
  readonly VITE_LOG_LEVEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 