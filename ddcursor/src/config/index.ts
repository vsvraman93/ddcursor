interface Config {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    url: string;
    apiUrl: string;
  };
  upload: {
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  security: {
    sessionDuration: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  features: {
    enableRealtime: boolean;
    enableFilePreview: boolean;
    enableNotifications: boolean;
  };
  isDevelopment: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const config: Config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'DDCursor',
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5173/api',
  },
  upload: {
    maxFileSize: Number(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760,
    allowedFileTypes: import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') || ['pdf', 'doc', 'docx', 'txt', 'md'],
  },
  security: {
    sessionDuration: Number(import.meta.env.VITE_SESSION_DURATION) || 3600,
    maxLoginAttempts: Number(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5,
    lockoutDuration: Number(import.meta.env.VITE_LOCKOUT_DURATION) || 300,
  },
  features: {
    enableRealtime: import.meta.env.VITE_ENABLE_REALTIME === 'true',
    enableFilePreview: import.meta.env.VITE_ENABLE_FILE_PREVIEW === 'true',
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  },
  isDevelopment: import.meta.env.VITE_DEV_MODE === 'true',
  logLevel: (import.meta.env.VITE_LOG_LEVEL as Config['logLevel']) || 'info',
};

export const validateConfig = (): void => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ] as const;

  const missingVars = requiredVars.filter(
    (varName) => !import.meta.env[varName as keyof ImportMetaEnv]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};

export default config; 