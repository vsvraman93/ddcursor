#!/bin/bash

# Exit on error
set -e

echo "Building the application..."
npm run build

echo "Deployment instructions:"
echo "1. Go to https://vercel.com/new"
echo "2. Import your GitHub repository: https://github.com/vsvraman93/ddcursor.git"
echo "3. Configure the following environment variables:"
echo "   - REACT_APP_SUPABASE_URL"
echo "   - REACT_APP_SUPABASE_ANON_KEY"
echo "4. Click 'Deploy'"

echo "Build completed successfully!" 