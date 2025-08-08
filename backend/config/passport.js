const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const { User } = require('../models');

// Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return done(null, false, { message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return done(null, false, { message: 'Account is deactivated' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return done(null, false, { message: 'Invalid credentials' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ where: { googleId: profile.id } });

    if (user) {
      // Update last login
      await user.update({ lastLogin: new Date() });
      return done(null, user);
    }

    // Check if user exists with same email
    user = await User.findOne({ where: { email: profile.emails[0].value } });

    if (user) {
      // Link Google account to existing user
      await user.update({
        googleId: profile.id,
        avatar: profile.photos[0]?.value,
        lastLogin: new Date()
      });
      return done(null, user);
    }

    // Create new user
    const newUser = await User.create({
      googleId: profile.id,
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      avatar: profile.photos[0]?.value,
      isEmailVerified: true, // Google emails are verified
      role: 'buyer',
      isActive: true
    });

    return done(null, newUser);
  } catch (error) {
    return done(error);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport; 