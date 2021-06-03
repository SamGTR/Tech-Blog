const router = require('express').Router();
const { User, Post, Comment } = require('../../models');
const withAuth = require('../../utils/auth');

router.get('/', (req, res) => {
    // Finding all users
    User.findAll({
        attributes: { exclude: ['password'] }
    })
      .then(userData => res.json(userData))
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  });

router.get('/:id', (req, res) => {
    // Finding a user with its ID
    User.findOne({
        attributes: { exclude: ['password']},
        where: {
          id: req.params.id
        },
        include: [
            {
              model: Post,
              attributes: ['id', 'title', 'post_content', 'created_at']
            },
            {
              model: Comment,
              attributes: ['id', 'comment_text', 'created_at'],
              include: {
                model: Post,
                attributes: ['title']
              }
            }
          ]

    })
      .then(userData => {
        if (!userData) {
          res.status(404).json({ message: 'No user found with this id' });
          return;
        }
        res.json(userData);
      })
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  });

router.post('/', async (req, res) => {
    // Creating a user 
    try{
      const userData= await 
    User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      github: req.body.github
    });
    // .then(userData => {
      req.session.save(() => {
        req.session.user_id = userData.id;
        req.session.username = userData.username;
        req.session.github = userData.github;
        req.session.loggedIn = true;
    
        res.json(userData);
      });
    }catch (err) {
      res.status(400).json(err);
    }
    // });
  });

  router.post('/login', (req, res) => {
    User.findOne({
      where: {
        email: req.body.email
      }
    })
    .then(userData => {
      if (!userData) {
        res.status(400).json({ message: 'No user with that email address!' });
        return;
      }
  
      const validPassword = userData.checkPassword(req.body.password);
  
      if (!validPassword) {
        res.status(400).json({ message: 'Incorrect email or password!' });
        return;
      }
  
      req.session.save(() => {
        req.session.user_id = userData.id;
        req.session.username = userData.username;
        req.session.github = userData.github;
        req.session.loggedIn = true;
  
        res.json({ user: userData, message: 'You are now logged in!' });
      });
    });
  });

  // Loging out
  router.post('/logout', (req, res) => {
    if (req.session.loggedIn) {
      req.session.destroy(() => {
        res.status(204).end();
      });
    }
    else {
      res.status(404).end();
    }
  });

router.put('/:id', withAuth, (req, res) => {
    // Updating user
    User.update(req.body, {
        individualHooks: true,
        where: {
            id: req.params.id
      }
    })
      .then(userData => {
        if (!userData[0]) {
          res.status(404).json({ message: 'No user found with this id' });
          return;
        }
        res.json(userData);
      })
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  });

router.delete('/:id', withAuth, (req, res) => {
    // Deleting user with ID
    User.destroy({
      where: {
        id: req.params.id
      }
    })
      .then(userData => {
        if (!userData) {
          res.status(404).json({ message: 'No user found with this id' });
          return;
        }
        res.json(userData);
      })
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  });

module.exports = router;