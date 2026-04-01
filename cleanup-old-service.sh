#!/bin/bash

# Cleanup old systemd service
echo "Cleaning up old systemd service..."

# Stop and disable the old service
sudo systemctl stop chinese-app.service 2>/dev/null || true
sudo systemctl disable chinese-app.service 2>/dev/null || true

# Remove the service file
sudo rm -f /etc/systemd/system/chinese-app.service

# Reload systemd
sudo systemctl daemon-reload

echo "✓ Old systemd service removed"
echo ""
echo "Now run: bash setup-autostart.sh"
