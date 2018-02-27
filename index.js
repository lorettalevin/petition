const express = require("express");
const hb = require("express-handlebars");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const db = require("./db");
const signPetition = db.signPetition;
const getSigners = db.getSigners;
const getSigURL = db.getSigURL;
const getSigCount = db.getSigCount;
const userRegistration = db.userRegistration;
const hashPassword = db.hashPassword;
const checkPassword = db.checkPassword;
const userLogin = db.userLogin;
const userProfile = db.userProfile;

const checkForSigID = function(req, res, next) {
    if (req.session.sigID) {
        next();
    } else {
        res.redirect("/petition");
    }
};

app.engine("handlebars", hb());
app.set("view engine", "handlebars");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + "/public"));
app.use(cookieSession({
    secret: "a really hard to guess secret",
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

app.get("/registration", function(req, res) {
    res.render("registration", {layout: "main"});
});

app.post("/registration", function(req, res) {
    if (!req.body.first || !req.body.last || !req.body.email || !req.body.password) {
        res.render("registration", {
            layout: "main",
            error: "Please fill out ALL the fields."
        });
    } else {
        hashPassword(req.body.password).then(function(hashedPassword) {
            userRegistration(req.body.first, req.body.last, req.body.email, hashedPassword).then(function(results) {
                req.session.user = {
                    id: results.rows[0].id,
                    first: req.body.first,
                    last: req.body.last
                };
                res.redirect('/profile');
            });
        });
    }
});

app.get("/profile", function(req, res) {
    res.render("profile", {layout: "main"});
});

app.post("/profile", function(req, res) {
    userProfile(req.body.age, req.body.city, req.body.url, req.session.user.id).then(function(results) {
        res.redirect('/petition');
    });
});

app.get("/login", function(req, res) {
    res.render("login", {layout: "main"});
});

app.post('/login', function(req, res) {
    if (!req.body.email || !req.body.password) {
        res.render("login", {
            layout: "main",
            error: "Please fill out ALL the fields."
        });
    } else {
        userLogin(req.body.email).then(function(results) {
            checkPassword(req.body.password, results.rows[0].hash).then(function(doesMatch) {
                if (doesMatch) {
                    req.session.user = {
                        id: results.rows[0].id,
                        email: req.body.email
                    };
                    res.redirect('/petition');
                }
            });
        });
    }
});

app.get("/petition", function(req, res) {
    if (req.session.sigID) {
        res.redirect("/thankyou");
    } else {
        res.render("petition", {layout: "signthepetition"});
    }
});

app.post("/petition", function(req, res) {
    if (!req.body.signature) {
        res.render("petition", {
            layout: "main",
            error: "Please fill out ALL the fields."
        });
    } else {
        signPetition(req.body.signature).then(function(results) {
            const sigID = results.rows[0].id;
            req.session = {
                sigID
            };
            res.redirect("/thankyou");
        });
    }
});

app.get("/thankyou", checkForSigID, function(req, res) {
    Promise.all([
        getSigURL(req.session.sigID),
        getSigCount()
    ]).then(function(results) {
        res.render("thankyou", {
            layout: "main",
            signature: results[0],
            count: results[1]
        });
    });
});

app.get("/signers", checkForSigID, function(req, res) {
    getSigners().then(function(signers) {
        res.render("signers", {
            layout: "main",
            signers
        });
    });
});

app.listen(8080, () => console.log("Listening"));
