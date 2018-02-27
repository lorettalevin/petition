const bcrypt = require('bcryptjs');
var spicedPg = require("spiced-pg");
var {
    dbUser,
    dbPass
} = require("./secrets");

var db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/signatures`);

function userRegistration(first, last, email, hash) {
    return new Promise(function(resolve, reject) {
        const q = "INSERT INTO users (first, last, email, hash) VALUES ($1, $2, $3, $4) RETURNING id";
        const params = [first, last, email, hash];
        db.query(q, params).then(function(results) {
            resolve(results);
        }).catch(function(err) {
            reject(err);
        });
    });
}

function userLogin(email) {
    return new Promise(function(resolve, reject) {
        const q = "SELECT hash, id FROM users WHERE email = $1";
        const params = [email];
        db.query(q, params).then(function(results) {
            resolve(results);
        }).catch(function(err) {
            reject(err);
        });
    });
}

function userProfile(age, city, url, userID) {
    return new Promise(function(resolve, reject) {
        const q = "INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4) RETURNING id";
        const params = [age, city, url, userID];
        db.query(q, params).then(function(results) {
            resolve(results);
        }).catch(function(err) {
            reject(err);
        });
    });
}

function hashPassword(plainTextPassword) {
    return new Promise(function(resolve, reject) {
        bcrypt.genSalt(function(err, salt) {
            if (err) {
                return reject(err);
            }
            bcrypt.hash(plainTextPassword, salt, function(err, hash) {
                if (err) {
                    return reject(err);
                }
                resolve(hash);
            });
        });
    });
}

function checkPassword(textEnteredInLoginForm, hashedPasswordFromDatabase) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(textEnteredInLoginForm, hashedPasswordFromDatabase, function(err, doesMatch) {
            if (err) {
                reject(err);
            } else {
                resolve(doesMatch);
            }
        });
    });
}

function signPetition(signature) {
    return new Promise(function(resolve, reject) {
        const q = "INSERT INTO signatures (signature) VALUES ($1) RETURNING id";
        const params = [signature];
        db.query(q, params).then(function(results) {
            resolve(results);
        }).catch(function(err) {
            reject(err);
        });
    });
}

function getSigURL(sigID) {
    return new Promise(function(resolve, reject) {
        const q = "SELECT signature FROM signatures WHERE id = $1";
        const params = [sigID];
        db.query(q, params).then(function(results) {
            resolve(results.rows[0].signature);
        }).catch(function(err) {
            reject(err);
        });
    });
}

function getSigCount() {
    return new Promise(function(resolve, reject) {
        const q = "SELECT COUNT(*) FROM signatures";
        db.query(q).then(function(results) {
            resolve(results.rows[0].count);
        }).catch(function(err) {
            reject(err);
        });
    });
}

function getSigners() {
    return new Promise(function(resolve, reject) {
        const q = `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
        FROM users
        JOIN user_profiles
        ON users.id = user_profiles.user_id`;
        db.query(q).then(function(results) {
            resolve(results.rows);
        }).catch(function(err) {
            reject(err);
        });
    });
}

module.exports = {
    userRegistration,
    userLogin,
    userProfile,
    hashPassword,
    checkPassword,
    signPetition,
    getSigURL,
    getSigCount,
    getSigners
};
