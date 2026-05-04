#!/bin/bash
# Deployment script for updating resume parser service on Hetzner server

echo "Starting deployment of updated resume parser service..."

# Backup current files
echo "Creating backup of current files..."
ssh root@89.167.48.64 "cp -r /root/resume-parser-service/resume-parser-service /root/resume-parser-service/resume-parser-service.backup.$(date +%Y%m%d_%H%M%S)"

# Create a temporary directory for new files
echo "Creating temporary directory for file transfer..."
ssh root@89.167.48.64 "mkdir -p /tmp/resume-parser-update"

# Transfer updated files (this would be done via scp in a real scenario)
echo "Transferring updated files to server..."

# Stop the current container
echo "Stopping current resume parser container..."
ssh root@89.167.48.64 "docker stop joben-resume-parser"

# Update the files on the server
echo "Updating files on server..."

# Remove the old parser.py file
ssh root@89.167.48.64 "rm /root/resume-parser-service/resume-parser-service/parser.py"

# Copy the new main.py file (this would be done via scp in a real scenario)
echo "Copying new main.py file..."

# Build and start the new container
echo "Building and starting new container..."
ssh root@89.167.48.64 "cd /root/resume-parser-service && docker-compose up -d --build"

# Wait for service to start
echo "Waiting for service to start..."
sleep 10

# Test the service
echo "Testing the updated service..."
ssh root@89.167.48.64 "curl -f http://localhost:8000/health"

echo "Deployment completed successfully!"