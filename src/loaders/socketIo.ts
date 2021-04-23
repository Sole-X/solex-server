import express from 'express';
import { SocketService } from '../services/SocketService';
import { Container } from 'typedi';

const SocketIO = require('socket.io');
const redis = require('socket.io-redis');
export default ({ app }: { app: express.Application }) => {
  const http = require('http').Server(app);
  var io = SocketIO(http,  {
    cors: {
      origin: '*',
    },
    pingTimeout: 10000,
    pingInterval: 3000
    
  });

  io.adapter(redis({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT })); 
  io.on('connection', (socket)=> {
    socket.on('send', function(hash) {     
      socket.join(hash);    
    }); 
  })

  return http
};
