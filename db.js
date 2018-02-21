var spicedPg = require("spiced-pg");
var { dbUser, dbPass } = require("./secrets");

var db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/signatures`);

function signPetition(first, last, signature) {
    const q =
        "INSERT INTO signatures (first, last, signature) VALUES ($1, $2, $3)";
    const params = [first, last, signature];
    return db
        .query(q, params)
        .then(function(results) {
            console.log(results.rows); //do a return
        })
        .catch(function(err) {
            console.log(err);
        });
}

db.query;

exports.signPetition = signPetition;
