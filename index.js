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

alexaApp.intent("nameIntent", {
        "slots": {"NAME": "LITERAL"},
        "utterances": [
            "my {name is|name's} {names|NAME}", "set my name to {names|NAME}"
        ]
    },
    function (request, response) {
        var name = request.slot("NAME");
        response.say("You changed your fucking name to " + name);
    }
);
alexaApp.intent("timeIntent", {
        "utterances": [
            "tell me what time is it", "what time is it"
        ]
    },
    function (request, response) {
        var options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
        var today = new Date(),
            todayDateString = today.toLocaleDateString('en-US', options),
            todayTimeString = today.toLocaleTimeString('en-US');
        response.say("It is " + todayDateString + ' ' + todayTimeString);
    }
);

alexaApp.intent("foodIntent", {
        "slots": {"FOOD": "LITERAL"},
        "utterances": [
            "best place for {foods|FOOD}"
        ]
    },
    function (request, response) {
        let place = 'Torstrasse, Berlin';
        let food = request.slot("FOOD");

        if (!food) {
            return response.say('You must specify a valid food type!');
        }

        return appYelpClient.search(food, place).then((resp)=> {
            let restaurants = resp.businesses.reduce((names, item)=> {
                if(!names){
                    names = [];
                }
                return names.concat(item.name);
            }, []).join(',');

            response.say("Top restaurants are  " + restaurants);
        }).catch((err)=> {
            console.error(err);
            response.say('Could not determine top restaurants!');
        });
    }
);

app.listen(PORT);
console.log("Listening on port " + PORT + ", try http://localhost:" + PORT + "/test");
