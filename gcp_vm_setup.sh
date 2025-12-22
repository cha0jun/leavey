#!/bin/bash
set -e

echo "Updating system packages..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

echo "Adding Docker's official GPG key..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo "Setting up the Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "Installing Docker Engine and Docker Compose..."
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "Setting up permissions for current user..."
sudo usermod -aG docker $USER

echo "------------------------------------------------"
echo "Installation complete!"
echo "IMPORTANT: Please log out and log back in for group changes to take effect."
echo "Then test with: docker run hello-world"
echo "------------------------------------------------"
