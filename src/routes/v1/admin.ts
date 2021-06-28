import { Router } from 'express';
const adminCtrl = require('../../controllers/AdminController');
const commonCtrl = require('../../controllers/CommonController');

const route = Router();
const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var path = require('path');
const dotEnv = require('dotenv-flow');
dotEnv.config();

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

export default (app: Router) => {
  app.use(passport.initialize());
  app.use(passport.session());
  app.use('/v1/admin', route);

  route.get('/kasInit', adminCtrl.makeKasAccount);

  route.post('/nft/category', adminCtrl.setCategory);

  route.post('/nft/collection', adminCtrl.setCollection);

  route.get('/test', function (req, res) {
    res.sendFile(path.join(path.dirname(require.main.filename) + '/resources/index.html'));
  });
  route.post('/sendletter', commonCtrl.sendNewsletter);

  route.post('/publisher', adminCtrl.addPublisher);
};
