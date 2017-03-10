var jsonfile = require('jsonfile');
var envVars = jsonfile.readFileSync('.env.json');

module.exports = {
    yelp: {
        client_id: envVars.yelp.client_id,
        grant_type: envVars.yelp.grant_type,
        client_secret: envVars.yelp.client_secret
    }
};