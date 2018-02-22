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

app.get("/petition", function(req, res) {
    if (req.session.sigID) {
        res.redirect("/signers");
    } else {
        res.render("petition", {layout: "main"});
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

    // getSigURL(req.session.sigID).then(function(signature) {
    //     getSigCount().then(function(count) {
    //         res.render("thankyou", {
    //             layout: "main",
    //             signature,
    //             count
    //         });
    //     });
    // });
});

app.get("/signaturepage", function(req, res) {
    res.render("signaturepage", {layout: "main"});
});

app.get("/signers", checkForSigID, function(req, res) {
    getSigners().then(function(signers) {
        res.render("signers", {
            layout: "main",
            signers
        });
    });
});

app.post("/petition", function(req, res) {
    if (!req.body.first || !req.body.last || !req.body.signature) {
        res.render("petition", {
            layout: "main",
            error: "Please fill out ALL the fields."
        });
    } else {
        signPetition(req.body.first, req.body.last, req.body.signature).then(function(results) {
            const sigID = results.rows[0].id;
            req.session = {
                sigID
            };
            res.redirect("/thankyou");
        });
    }
});

app.listen(8080, () => console.log("Listening"));
