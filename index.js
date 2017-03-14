var express = require("express");
var alexa = require("alexa-app");
const request = require('request');
const config = require('./config');

const YelpClient = require('./yelp/client');
let appYelpClient = new YelpClient(config, request);

var PORT = process.env.port || 8080;
var app = express();

// ALWAYS setup the alexa app and attach it to express before anything else.
var alexaApp = new alexa.app("test");

alexaApp.express({
    expressApp: app,

    // verifies requests come from amazon alexa. Must be enabled for production.
    // You can disable this if you're running a dev environment and want to POST
    // things to test behavior. enabled by default.
    checkCert: false,

    // sets up a GET route when set to true. This is handy for testing in
    // development, but not recommended for production. disabled by default
    debug: true
});

// now POST calls to /test in express will be handled by the app.request() function

// from here on you can setup any other express routes or middlewares as normal
app.set("view engine", "ejs");

alexaApp.launch(function (request, response) {
    response.say("You launched the app!");
});

alexaApp.dictionary = {
    "names": ["bob", "tejas", "oskar"],
    foods: ['pizza', 'pasta', 'burgers', 'sushi', 'sandwiches', 'soup', 'asian']
};


alexaApp.intent("foodIntent", {
        "slots": {
            "FOOD": "LITERAL",
            "LOCATION": "LOCATION" //this needs to be defined in the amazon dev portal
        },
        "utterances": [
            "i want to eat {foods|FOOD} in {-|LOCATION}",
            "best place for {foods|FOOD} in {-|LOCATION}"
        ]
    },
    function (request, response) {
        let session = request.getSession(),
            place = request.slot("LOCATION"),
            food = request.slot("FOOD"),
            restaurantLocation = [];

        if (!food) {
            return response.say('You must specify a valid food type!');
        }

        if (!place) {
            return response.say('Cannot determine location');
        }

        return appYelpClient.search(food, place).then((resp)=> {
            let restaurants = resp.businesses.reduce((names, item, index)=> {
                if (!names) {
                    names = [];
                }

                let locationIndex = (index + 1);
                restaurantLocation[locationIndex] = `${item.location.address1} ${item.location.city}`;
                return names.concat(`${locationIndex}. ${item.name}`);
            }, []).join(',');

            if (!restaurants.length) {
                throw Error('Could not get a proper response!');
            }

            restaurantLocation.forEach((item, index)=> {
                session.set('restaurant-' + index, item);
            });

            response.say(`top restaurants in ${place} are ${restaurants}`);
            response.shouldEndSession(false);
        }).catch((err)=> {
            console.error(err);
            response.say('Could not determine top restaurants!');
        });
    }
);

alexaApp.intent("addressFoodIntent", {
        "slots": {
            "number": "AMAZON.NUMBER"
        },
        "utterances": [
            "address of {-|number}", "where is number {-|number}"
        ]
    },
    (request, response) => {
        let session = request.getSession(),
            restaurantNr = request.slot("number"),
            restaurantAddress = session.get('restaurant-' + restaurantNr);

        if (!session.get('restaurant-1')) {
            return response.say('You must require top place first!');
        }

        if (restaurantNr > 5) {
            response.say(`Only using top 5 recomandations!`);
            response.shouldEndSession(false);
            return;
        }

        if (restaurantAddress) {
            response.say(
                `Address of ${restaurantNr} is ${restaurantAddress}.
                Please rate from 1 to 5 your experience.`
            );
            return;
        }

        return response.say('Could not determine the location of the restaurant');
    }
);


alexaApp.intent("ratingIntent", {
        "slots": {
            "number": "AMAZON.NUMBER"
        },
        "utterances": [
            "{-|number} out of 5"
        ]
    },
    (request, response) => {
        let rating = request.slot("number");


        if (rating <= 5 && rating >= 1) {
            response.say('Thank you for rating us!')
        }

        return response.say('Invalid rating!');
    }
);

app.listen(PORT);
console.log("Listening on port " + PORT + ", try http://localhost:" + PORT + "/test");
