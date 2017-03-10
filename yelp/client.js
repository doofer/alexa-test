"use strict";

var Promise = require('promise');

class YelpClient {
    constructor(config, request) {
        this.config = config;
        this.request = request;
        this.authUrl = 'https://api.yelp.com/oauth2/token';
        this.searchUrl = 'https://api.yelp.com/v3/businesses/search';
    }

    getAuthToken() {
        return new Promise((success, reject) => {
            this.request({
                url: this.authUrl,
                method: "POST",
                form: {
                    client_id: this.config.yelp.client_id,
                    grant_type: this.config.yelp.grant_type,
                    client_secret: this.config.yelp.client_secret
                }
            }, (error, response, body) => {
                success(JSON.parse(response.body));

                if (error) {
                    reject(error);
                }
            });
        }).catch((resp)=> {
            console.error(resp);
        });
    }

    search(terms, location) {
        return this.getAuthToken().then((resp)=> {
            this.accessToken = resp.access_token;
            return resp;
        }).then(()=> {
            return new Promise((success, reject) => {
                this.request({
                    url: this.searchUrl + `?term=${terms}&location='${location}'&sort_by=rating&limit=5`,
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }, function (error, response, body) {
                    if (error) {
                        reject(error);
                    }
                    success(JSON.parse(response.body));
                });
            });
        }).catch((resp)=> {
            console.error(resp);
        });
    }
}

module.exports = YelpClient;