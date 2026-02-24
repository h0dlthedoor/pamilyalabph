#!/bin/bash

# --- Color Codes for Clarity ---
GREEN='\033[0s;32m'
BLUE='\033[0s;34m'
NC='\033[0m'

echo -e "${BLUE}Starting Professional Workstation Setup...${NC}"

# 1. Update System
echo -e "${GREEN}Updating package lists...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Install Core Infrastructure
echo -e "${GREEN}Installing Core Dev Tools (Build-Essential, Zip, JQ, etc.)...${NC}"
sudo apt install -y build-essential unzip zip curl wget jq pkg-config libssl-dev

# 3. Install Productivity & Search Tools
echo -e "${GREEN}Installing High-Velocity Tools (FZF, Ripgrep, Bat, Tree)...${NC}"
sudo apt install -y fzf ripgrep bat tree htop ncdu net-tools

# 4. Install GitHub CLI
echo -e "${GREEN}Installing GitHub CLI...${NC}"
type -p curl >/dev/null || (sudo apt update && sudo apt install curl -y)
sudo mkdir -p -m 755 /etc/apt/keyrings
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null
sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh -y

# 5. Setup Zoxide (Smart CD)
echo -e "${GREEN}Installing Zoxide...${NC}"
curl -sS https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | bash

# 6. Cleanup
echo -e "${GREEN}Cleaning up...${NC}"
sudo apt autoremove -y && sudo apt clean

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}Setup Complete! Remaining Manual Steps:${NC}"
echo -e "1. Run 'gh auth login' to connect GitHub."
echo -e "2. Add 'eval \"\$(zoxide init bash)\"' to your ~/.bashrc"
echo -e "3. Restart your terminal.${NC}"
echo -e "${BLUE}==========================================${NC}"
