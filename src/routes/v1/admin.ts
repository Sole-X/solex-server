import { Router } from 'express';
const adminCtrl = require("../../controllers/AdminController");
const commonCtrl = require("../../controllers/CommonController");

const route = Router();
const passport = require('passport');
var GoogleStrategy = require( 'passport-google-oauth20' ).Strategy
var path = require('path');

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new GoogleStrategy({
    clientID: '177516767610-a3abl0r72of303q808tn4odvc8a9bvc7.apps.googleusercontent.com',
    clientSecret: '7j33F6a0OQ7R5xKUquQBtS4S',
    callbackURL: 'http://localhost:8080/v1/admin/auth/google/callback'
  }, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
      return done(null,profile);
    });
  }
));

export default (app: Router) => {
  app.use(passport.initialize());
  app.use(passport.session());
  app.use('/v1/admin', route);
  
  route.get('/kasInit', adminCtrl.makeKasAccount);

  route.post('/nft/category', adminCtrl.setCategory);

  route.post('/nft/collection', adminCtrl.setCollection);


  route.get('/test', function(req, res) {
    res.sendFile(path.join(path.dirname(require.main.filename)+ '/resources/index.html'));
  });
  route.post('/sendletter', commonCtrl.sendNewsletter)

  route.post('/publisher', adminCtrl.addPublisher)

};
