import 'reflect-metadata'; // We need this in order to use @Decorators
import express from 'express';
const dotEnv = require('dotenv-flow');
dotEnv.config();

async function startServer() {
  const app = express();
  await require('./loaders').default({ expressApp: app });
}

startServer();
