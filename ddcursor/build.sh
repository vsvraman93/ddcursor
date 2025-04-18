#!/bin/bash

# Exit on error
set -e

echo "Installing dependencies..."
npm install

echo "Running tests..."
npm test -- --watchAll=false

echo "Building application..."
npm run build

echo "Build completed successfully!" 