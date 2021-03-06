const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');

//POST new user route (optional, everyone has access)
router.post('/', auth.optional, (req, res, next) => {
  const {
    body: { user }
  } = req;

  if (!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required'
      }
    });
  }

  if (!user.password) {
    return res.status(422).json({
      errors: {
        password: 'is required'
      }
    });
  }

  Users.findOne({ email: user.email }, function(err, existingUser) {
    //In case of error return
    if (err) {
      console.log('Error in SignUp:' + err);
      return res
        .status(422)
        .json({ errors: { message: 'Some error occured' } });
    }

    //User with email already exists
    if (existingUser) {
      console.log('User with email already exists');
      return res.status(422).json({
        errors: {
          message: 'user with Email address ' + user.email + ' already exists'
        }
      });
    } else {
      const finalUser = new Users(user);

      finalUser.setPassword(user.password);

      return finalUser
        .save()
        .then(() => res.json({ user: finalUser.toAuthJSON() }));
    }
  });
});

//POST login route (optional, everyone has access)
router.post('/login', auth.optional, (req, res, next) => {
  const {
    body: { user }
  } = req;

  if (!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required'
      }
    });
  }

  if (!user.password) {
    return res.status(422).json({
      errors: {
        password: 'is required'
      }
    });
  }

  return passport.authenticate(
    'local',
    { session: false },
    (err, passportUser, info) => {
      if (err) {
        return res.status(422).json({
          errors: {
            messsage: err.message
          }
        });
      }

      if (passportUser) {
        const user = passportUser;
        user.token = passportUser.generateJWT();

        return res.json({ user: user.toAuthJSON() });
      }

      return status(400).info;
    }
  )(req, res, next);
});

//GET current route (required, only authenticated users have access)
router.get('/current', auth.required, (req, res, next) => {
  const {
    payload: { id }
  } = req;

  console.log(req.payload);

  return Users.findById(id).then(user => {
    if (!user) {
      return res.sendStatus(400);
    }

    return res.json({ user: user.toAuthJSON() });
  });
});

router.get('/all', auth.required, (req, res, next) => {
  return Users.find({}, { email: 1 }).then(users => {
    if (!users) {
      res.sendStatus(400);
    }

    return res.json({ users });
  });
});

module.exports = router;
