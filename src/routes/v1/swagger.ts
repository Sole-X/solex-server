import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_OAUTH2_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_OAUTH2_CALLBACK_URL,
    },
    function (accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        return done(null, profile);
      });
    },
  ),
);
const route = Router();

export default (app: Router) => {
  app.use(passport.initialize());
  app.use(passport.session());
  const swaggerDocument = require('../../resources/swagger.json');
  app.get('/v1/api-docs/login', passport.authenticate('google', { scope: ['profile'] }));

  app.use('/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // app.use('/v1/api-docs',passport.authenticate( 'google', { scope:['profile'],failureRedirect: '/' }),
  //   swaggerUi.serve
  // ,
  //  swaggerUi.setup(swaggerDocument) );
};
