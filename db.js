var spicedPg = require("spiced-pg");
var { dbUser, dbPass } = require("./secrets");

var db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/signatures`);

function signPetition(first, last, signature) {
    return new Promise(function(resolve, reject) {
        const q =
            "INSERT INTO signatures (first, last, signature) VALUES ($1, $2, $3) RETURNING id";
        const params = [first, last, signature];
        db
            .query(q, params)
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

function getSigners() {
    return new Promise(function(resolve, reject) {
        const q = "SELECT first, last FROM signatures";
        db
            .query(q)
            .then(function(results) {
                resolve(results.rows);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

function getSigURL(sigID) {
    return new Promise(function(resolve, reject) {
        const q = "SELECT signature FROM signatures WHERE id = $1";
        const params = [sigID];
        db
            .query(q, params)
            .then(function(results) {
                resolve(results.rows[0].signature);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

function getSigCount() {
    return new Promise(function(resolve, reject) {
        const q = "SELECT COUNT(*) FROM signatures";
        db
            .query(q)
            .then(function(results) {
                resolve(results.rows[0].count);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports = {
    getSigURL,
    signPetition,
    getSigners,
    getSigCount
};
