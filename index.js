const express = require("express");
const hb = require("express-handlebars");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const db = require("./db");
const signPetition = db.signPetition;

app.engine("handlebars", hb());
app.set("view engine", "handlebars");
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));

app.get("/petition", function(req, res) {
    res.render("petition", { layout: "main" });
});

app.get("/thankyou", function(req, res) {
    res.render("thankyou", { layout: "main" });
});

app.get("/signaturepage", function(req, res) {
    res.render("signaturepage", { layout: "main" });
});

app.post("/petition", function(req, res) {
    if (!req.body.first || !req.body.last || !req.body.signature) {
        res.render("petition", {
            layout: "main",
            error: "You done fucked up."
        });
    } else {
        signPetition(req.body.first, req.body.last, req.body.signature).then(
            function() {
                res.redirect("/thankyou");
            }
        );
    }
});

app.listen(8080, () => console.log("Listening"));
