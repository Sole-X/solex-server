import { Router } from "express";
import swaggerUi from "swagger-ui-express";
const passport = require("passport");
var GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(
  new GoogleStrategy(
    {
      clientID:
        "177516767610-a3abl0r72of303q808tn4odvc8a9bvc7.apps.googleusercontent.com",
      clientSecret: "7j33F6a0OQ7R5xKUquQBtS4S",
      callbackURL: "http://localhost:8080/v1/api-docs",
    },
    function (accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        return done(null, profile);
      });
    }
  )
);
const route = Router();

export default (app: Router) => {
  app.use(passport.initialize());
  app.use(passport.session());
  const swaggerDocument = require("../../resources/swagger.json");
  app.get(
    "/v1/api-docs/login",
    passport.authenticate("google", { scope: ["profile"] })
  );

  app.use("/v1/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // app.use('/v1/api-docs',passport.authenticate( 'google', { scope:['profile'],failureRedirect: '/' }),
  //   swaggerUi.serve
  // ,
  //  swaggerUi.setup(swaggerDocument) );
};
