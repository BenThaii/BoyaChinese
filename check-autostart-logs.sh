#!/bin/bash

echo "Checking Chinese App service logs..."
echo "===================================="
echo ""

echo "Service status:"
sudo systemctl status chinese-app.service --no-pager -l

echo ""
echo "Recent logs (last 50 lines):"
sudo journalctl -u chinese-app -n 50 --no-pager

echo ""
echo "To follow logs in real-time, run:"
echo "  sudo journalctl -u chinese-app -f"
