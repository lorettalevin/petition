const express = require("express");
const hb = require("express-handlebars");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const db = require("./db");
const csurf = require('csurf');


const checkForSigID = function(req, res, next) {
    if (req.session.user.sigID) {
        next();
    } else {
        res.redirect("/petition");
    }
};

const checkForLogin = function(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

const checkForLogout = function(req, res, next) {
    if (req.session.user) {
        return res.redirect("/petition");
    } else {
        next();
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

app.use(csurf());

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.get('/', function(req, res) {
    res.redirect("/registration");
});

app.get("/registration", checkForLogout, function(req, res) {
    res.render("registration", {layout: "loggedoutmain"});
});

app.post("/registration", function(req, res) {
    if (!req.body.first || !req.body.last || !req.body.email || !req.body.password) {
        res.render("registration", {
            layout: "loggedoutmain",
            error: "Please fill out ALL the fields."
        });
    } else {
        db.hashPassword(req.body.password).then(function(hashedPassword) {
            db.userRegistration(req.body.first, req.body.last, req.body.email, hashedPassword).then(function(results) {
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

app.get("/profile", checkForLogin, function(req, res) {
    res.render("profile", {layout: "main"});
});

app.post("/profile", function(req, res) {
    db.userProfile(req.body.age, req.body.city, req.body.url, req.session.user.id).then(function() {
        res.redirect('/petition');
    });
});

app.get("/login", checkForLogout, function(req, res) {
    res.render("login", {layout: "loggedoutmain"});
});

app.post('/login', function(req, res) {
    if (!req.body.email || !req.body.password) {
        res.render("login", {
            layout: "loggedoutmain",
            error: "Please fill out ALL the fields."
        });
    } else {
        db.userLogin(req.body.email).then(function(results) {
            if (results.rows[0]) {
                db.checkPassword(req.body.password, results.rows[0].hash).then(function(doesMatch) {
                    if (doesMatch) {
                        req.session.user = {
                            id: results.rows[0].id,
                            email: req.body.email
                        };
                        res.redirect('/petition');
                    } else {
                        res.render("login", {
                            layout: "loggedoutmain",
                            error: "Oops! Invalid password!"
                        });
                    }
                });
            }
        });
    }
});

app.get("/petition", checkForLogin, function(req, res) {
    if (req.session.user.sigID) {
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
        db.signPetition(req.body.signature).then(function(results) {
            const sigID = results.rows[0].id;
            req.session.user.sigID = sigID;
            res.redirect("/thankyou");
        });
    }
});

app.get("/thankyou", checkForLogin, checkForSigID, function(req, res) {
    Promise.all([
        db.getSigURL(req.session.user.sigID),
        db.getSigCount()
    ]).then(function(results) {
        res.render("thankyou", {
            layout: "main",
            signature: results[0],
            count: results[1],

        });
    });
});

app.get("/signers", checkForLogin, checkForSigID, function(req, res) {
    db.getSigners().then(function(signers) {
        res.render("signers", {
            layout: "main",
            signers
        });
    });
});

app.get('/petition/signers/:city', checkForLogin, checkForSigID, function(req, res) {
    db.getSignersByCity(req.params.city).then(function(signers) {
        res.render("signers", {
            layout: "main",
            hideCity: true,
            signers
        });
    });
});

app.get('/edit', checkForLogin, function(req, res) {
    db.checkForRowInUserProfile(req.session.user.id).then(function(rowExists) {
        if (rowExists) {
            db.populateProfile(req.session.user.id).then(function(results) {
                res.render("edit", {
                    layout: "main",
                    first: results.first,
                    last: results.last,
                    email: results.email,
                    age: results.age,
                    city: results.city,
                    url: results.url
                });
            });
        } else {
            db.selectFromUsersTable(req.session.user.id).then(function(results) {
                res.render('edit', {
                    layout: 'main',
                    first: results.first,
                    last: results.last,
                    email: results.email
                });
            });
        }
    });
});

app.post("/edit", function(req, res) {
    const {
        first,
        last,
        email,
        age,
        city,
        homepage,
        password
    } = req.body;

    if (password) {
        db.hashPassword(password).then(function(hashedPassword) {
            db.updateWithPasswordProfile(hashedPassword, req.session.user.id).then(function() {
                res.redirect('/petition');
            });
        });
    } else {
        db.updateWithoutPasswordProfile(first, last, email, req.session.user.id).then(function() {
            db.checkForRowInUserProfile(req.session.user.id).then(function(rowExists) {
                if (rowExists) {
                    db.updateUserProfile(age, city, homepage, req.session.user.id).then(function() {
                        res.redirect('/petition');
                    });
                } else {
                    db.insertProfile(req.session.user.id, age, city, homepage).then(function() {
                        res.redirect("/petition");
                    });
                }
            });
        });
    }
});

app.post("/delete", function(req, res) {
    db.deleteSigID(req.session.user.sigID).then(function() {
        req.session.user.sigID = null;
        res.redirect("/petition");
    });
});

app.get("/logout", function(req, res) {
    req.session = null;
    res.redirect("/login");
});

app.listen(process.env.PORT || 8080, () => console.log("Listening"));
