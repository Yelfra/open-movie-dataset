const express = require('express');
const router = express.Router();

router.get('/', function (req, res, next) {

    //console.log(req.oidc.isAuthenticated());
    res.render('../views/profile', {
        title: "OMD - Profile",
        isAuthenticated: req.oidc.isAuthenticated(),
        user: req.oidc.user
    });
});

module.exports = router;