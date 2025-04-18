# DDCursor - M&A Due Diligence Data Room

A secure and efficient web application for managing M&A due diligence processes, built with React, TypeScript, and Supabase.

## Features

- **Secure Authentication**
  - Email/password login with MFA
  - SSO integration (Google, Microsoft)
  - Role-based access control (Consultants, Clients, Company)

- **Document Management**
  - Hierarchical folder structure
  - Version control
  - File deduplication
  - Cloud storage integration
  - Virus scanning
  - Watermarking
  - Access logging

- **Questionnaire System**
  - Category-based organization
  - Response tracking
  - Status management
  - Threaded discussions
  - @mentions
  - Real-time notifications

- **Analytics Dashboard**
  - Progress tracking
  - Completion metrics
  - Activity logs
  - Custom reports
  - Export capabilities

## Technical Stack

- **Frontend**
  - React
  - TypeScript
  - Material-UI
  - Recharts

- **Backend**
  - Supabase
  - PostgreSQL
  - JWT Authentication

- **Storage**
  - Supabase Storage
  - Cloud provider integrations

- **Security**
  - AES-256 encryption
  - TLS 1.3
  - SOC 2 compliance
  - GDPR compliance

## Environment Setup

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Supabase account and project

### Environment Variables

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update the following required variables in `.env`:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Optional Environment Variables

Configure these variables to customize the application behavior:

#### Application Settings
- `VITE_APP_NAME`: Application name (default: "DDCursor")
- `VITE_APP_URL`: Application URL (default: "http://localhost:5173")
- `VITE_API_URL`: API URL (default: "http://localhost:5173/api")

#### File Upload Settings
- `VITE_MAX_FILE_SIZE`: Maximum file size in bytes (default: 10MB)
- `VITE_ALLOWED_FILE_TYPES`: Comma-separated list of allowed file extensions

#### Security Settings
- `VITE_SESSION_DURATION`: Session duration in seconds (default: 3600)
- `VITE_MAX_LOGIN_ATTEMPTS`: Maximum login attempts before lockout (default: 5)
- `VITE_LOCKOUT_DURATION`: Account lockout duration in seconds (default: 300)

#### Feature Flags
- `VITE_ENABLE_REALTIME`: Enable real-time updates (default: true)
- `VITE_ENABLE_FILE_PREVIEW`: Enable file preview feature (default: true)
- `VITE_ENABLE_NOTIFICATIONS`: Enable notifications (default: true)

#### Development Settings
- `VITE_DEV_MODE`: Enable development mode (default: true)
- `VITE_LOG_LEVEL`: Logging level (debug/info/warn/error) (default: info)

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Production

1. Build the application:
```bash
npm run build
```

2. Preview the production build:
```bash
npm run preview
```

## Environment Validation

The application validates required environment variables on startup. If any required variables are missing, the application will throw an error with details about the missing variables.

## Security Considerations

1. Never commit the `.env` file to version control
2. Keep your Supabase keys secure
3. Use appropriate values for security settings in production
4. Regularly rotate API keys and review security settings

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ddcursor.git
   cd ddcursor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_SUPABASE_URL=your-actual-supabase-url
   REACT_APP_SUPABASE_ANON_KEY=your-actual-supabase-key
   REACT_APP_STORAGE_BUCKET=ddcursor-storage
   REACT_APP_ENCRYPTION_KEY=your_encryption_key
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Database Setup

1. Create the following tables in your Supabase database:

   - users
   - user_settings
   - workspaces
   - workspace_settings
   - documents
   - questions
   - comments
   - activity_log

2. Set up the necessary storage buckets and policies.

3. Configure authentication providers in Supabase.

## Security Features

- **Data Encryption**
  - All sensitive data is encrypted at rest using AES-256
  - Secure key management
  - Regular security audits

- **Access Control**
  - Role-based permissions
  - IP whitelisting
  - Session management
  - Audit logging

- **Compliance**
  - SOC 2 compliance
  - GDPR compliance
  - Regular security assessments
  - Penetration testing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@ddcursor.com or join our Slack channel.

## Acknowledgments

- Supabase team for their excellent platform
- Material-UI for the component library
- All contributors who have helped shape this project 