#!/bin/bash

echo "🚀 Sistem başlatılıyor..."

# Portları temizle
echo "🧹 Eski süreçler temizleniyor (Port 8000 ve 3000)..."
fuser -k 8000/tcp 2>/dev/null
fuser -k 3000/tcp 2>/dev/null

# Backend'i başlat (istikbal ortamı ile)
echo "🔌 Backend başlatılıyor..."
conda run -n istikbal python -u demo_server.py > backend.log 2>&1 &
BACKEND_PID=$!

# Frontend'i başlat
echo "💻 Frontend başlatılıyor..."
echo "🔗 Dashboard şu adreste erişilebilir: http://192.168.0.13:3000"
cd dashboard
bun run dev

# Çıkış yapıldığında backend'i de kapat
trap "kill $BACKEND_PID" EXIT
