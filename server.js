const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let players = {};
let sphere = {
  x: 0,
  y: 10,
  z: 0,
  qx: 0,
  qy: 0,
  qz: 0,
  qw: 1
};

// Positions initiales spécifiques pour les joueurs
const initialPositions = [
  { x: 10, y: 0.5, z: 0 },
  { x: -10, y: 0.5, z: 0 }
];

// Variables de score
let score1 = 0;
let score2 = 0;

io.on('connection', (socket) => {
  console.log('Nouvel utilisateur connecté :', socket.id);

  // Assigner une position initiale spécifique au joueur
  const playerIndex = Object.keys(players).length % initialPositions.length;
  const initialPosition = initialPositions[playerIndex];

  players[socket.id] = {
    id: socket.id,
    x: initialPosition.x,
    y: initialPosition.y,
    z: initialPosition.z,
    qx: 0,
    qy: 0,
    qz: 0,
    qw: 1,
    color: '#' + Math.floor(Math.random() * 16777215).toString(16)
  };

  socket.emit('init', players);
  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].z = data.z;
      players[socket.id].qx = data.qx;
      players[socket.id].qy = data.qy;
      players[socket.id].qz = data.qz;
      players[socket.id].qw = data.qw;
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  socket.on('sphereMove', (data) => {
    sphere.x = data.x;
    sphere.y = data.y;
    sphere.z = data.z;
    sphere.qx = data.qx;
    sphere.qy = data.qy;
    sphere.qz = data.qz;
    sphere.qw = data.qw;
    socket.broadcast.emit('updateSpherePosition', sphere);
  });

  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté :', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });

  // Mettre à jour le score
  socket.on('goal', (data) => {
    if (data.team === 1) {
      score1++;
    } else if (data.team === 2) {
      score2++;
    }
    io.emit('updateScore', { score1, score2 });
  });

  socket.on('resetBall', () => {
    io.emit('resetBall');
  });

});

// Envoyer les mises à jour de position à une fréquence plus élevée
setInterval(() => {
  io.emit('updatePositions', players);
  io.emit('updateSpherePosition', sphere);
}, 50);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});