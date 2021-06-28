import { Container } from 'typedi';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from '../routes';
import fs from 'fs';

export default ({ app }: { app: express.Application }) => {
  const logger: any = Container.get('logger');

  /**
   * Health Check endpoints
   * @TODO Explain why they are here
   */
  app.get('/status', (req, res) => {
    res.status(200).end();
  });
  app.head('/status', (req, res) => {
    res.status(200).end();
  });

  // Useful if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
  // It shows the real origin IP in the heroku or Cloudwatch logs
  app.enable('trust proxy');

  // The magic package that prevents frontend developers going nuts
  // Alternate description:
  // Enable Cross Origin Resource Sharing to all origins by default
  app.use(cors());
  // Some sauce that always add since 2014
  // "Lets you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it."
  // Maybe not needed anymore ?

  // profile image folder check
  if (!fs.existsSync('uploads/images')) fs.mkdirSync('uploads/images', { recursive: true });
  if (!fs.existsSync('logs/error')) fs.mkdirSync('logs/error', { recursive: true });

  app.use(express.static('uploads'));

  // Middleware that transforms the raw string of req.body into json
  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );

  // Load routes
  routes(app);

  /// catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err['status'] = 404;
    next(err);
  });

  /// error handlers
  app.use((err, req, res, next) => {
    return res.status(400).json({ msg: err.message });
  });
};
