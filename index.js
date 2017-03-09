var express = require("express");
var alexa = require("alexa-app");

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

alexaApp.dictionary = {"names": ["bob", "tejas", "oskar"]};

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

app.listen(PORT);
console.log("Listening on port " + PORT + ", try http://localhost:" + PORT + "/test");
