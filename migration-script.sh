#!/bin/bash

# Navigate to the combined directory
cd /Users/gverma/Desktop/SuperThinks/Aldeia_chatbot/chatbot/Aldeia-Chatbot/aldeia-combined

# Copy backend
cp -r "/Users/gverma/Desktop/SuperThinks/Aldeia_chatbot/backend" "./apps/"

# Copy frontend (rename to avoid confusion)  
cp -r "/Users/gverma/Desktop/SuperThinks/Aldeia_chatbot/frontend" "./apps/chatbot-frontend"

# Copy database and documents
cp "/Users/gverma/Desktop/SuperThinks/Aldeia_chatbot/aldeia.db" "./data/"
cp -r "/Users/gverma/Desktop/SuperThinks/Aldeia_chatbot/frontend/public/"* "./data/documents/"

# Copy docker files
cp "/Users/gverma/Desktop/SuperThinks/Aldeia_chatbot/docker-compose.yml" "./"

# Copy the Next.js rebuild platform
cp -r "/Users/gverma/Desktop/SuperThinks/Aldeia UI/aldeia-rebuild-platform/"* "./apps/rebuild-platform/"

echo "Files copied successfully!"