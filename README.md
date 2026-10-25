# SplitRace

## Instalación
    npm install

## 1. Servidor (una persona, o un VPS)
    npm run server        # http://localhost:8080

## 2. Cada jugador
En LiveSplit: clic derecho > Control > Start Server (puerto 16834).
Luego:
    node agent.js --room CARRERA1 --name Ana --splits 12 --server ws://IP_DEL_SERVIDOR:8080

`--splits` es el número total de splits de tu archivo (LiveSplit no lo informa).

## 3. Dashboard
Abre http://IP_DEL_SERVIDOR:8080/?room=CARRERA1

## Pruebas sin LiveSplit
    node mock-livesplit.js   # simula LiveSplit en el puerto 16834

## Modo sin instalar nada (recomendado)
Cada jugador abre `http://IP_DEL_SERVIDOR:8080/play?room=CARRERA1`, escribe su nombre y pulsa Conectar.
Requiere LiveSplit Server con soporte WebSocket (versiones recientes) y Chrome/Edge/Firefox.
El navegador puede pedir permiso para acceder a la red local: hay que aceptarlo.
