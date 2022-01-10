const express = require('express');
const router = express.Router();

router.get('/', function (req, res, next) {

    //console.log(req.oidc.isAuthenticated());
    res.render('../views/home', {
        title: "OMD - Home",
        isAuthenticated: req.oidc.isAuthenticated(),
        user: req.oidc.user
    });
});

module.exports = router;