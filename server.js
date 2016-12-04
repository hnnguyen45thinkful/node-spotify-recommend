//Created and edited by Hieu Nguyen
var unirest = require('unirest');
var express = require('express');
var events = require('events');
//Applying the application express and also the directory.
var app = express();
app.use(express.static('public'));
//The endpoint is in the getFromApi parameter and also its a "string"
//The arguements (args) is the main object used to request the spotify player/music.
var getFromApi = function(endpoint, args) {
//Applying emitter to new objects and also inform the uder by grabbing all the data from the getFromAPI.   
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
                if (response.ok) {
                    emitter.emit('end', response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};

//Challenge to get search related to other artists.
// First I define a function/var called function getRelatedArtists and getTopTracksArtists for the aritst.
// https://developer.spotify.com/web-api/get-related-artists/
// GET https://api.spotify.com/v1/artists/{id}/related-artists

//Similar from getFromApi
var getRelatedArtists = function(id) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/artists/' + id + '/related-artists/')
        .end(function(response) {
            if (response.ok) {
                emitter.emit('end', response.body);
            } else {
                emitter.emit('error', response.code);
            }
        });
    return emitter;
};
//Similar from the getFromApi
var getTopTracks = function(id) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/artists/' + id + '/top-tracks')
        .qs({country: 'US'})
        .end(function(response) {
            if (response.ok) {
                emitter.emit('end', response.body);
            } else {
                emitter.emit('error', response.code);
            }
        });
    return emitter;
};


//Using the search and getting a specific name for the use and get request of spotify.
app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });
//Creating a boolean if the list is false and also the top list false and starting at zero with variables.
    searchReq.on('end', function(item) {
        var relatedComplete = false;
        var topComplete = false;
        var complete = 0;
        var count = 0;
        var checkComplete = function() {
            if (relatedComplete && topComplete) {
                res.json(artist);
            }
        };
        var checkTopComplete = function() {
            if (complete === count) {
                topComplete = true;
                checkComplete();
            }
        };
        var artist = item.artists.items[0];
        var idName = artist.id;
        // var relatedReq = getFromApi('artists/' + id + '/related-artists/');
        //Create a new variable from above with new id.
        var relatedReq = getRelatedArtists(idName);
        relatedReq.on('end', function(item) {
            artist.related = item.artists;
            count = artist.related.length;
            artist.related.forEach(function(artist) {
                var relId = artist.id;
                var topReq = getTopTracks(relId);
                topReq.on('end', function(item) {
                    artist.tracks = item.tracks;
                    complete++;
                    checkTopComplete();
                });
                topReq.on('error', function(code) {
                    res.sendStatus(code);
                });
            });
            relatedComplete = true;
            checkComplete();
        });
        relatedReq.on('error', function(code) {
            res.sendStatus(code);
        });
    });

    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
});

app.listen(process.env.PORT || 8080);
console.log("Server is listening to http://localhost:8080")


// Challenge
// Alter the above application to retrieve a list of artists related to the artist you search for.

// In order to do this you will need to:

// Make a request to the get related artists endpoint
// This should happen after the search request has emitted its end event
// It should use the artist ID from the artist object
// If the request is successful, then artist.related should be set to item.artists, where item is the object returned by the get related artists endpoint.
// The entire artist object should then be sent as a response to the client.
// If the request is unsuccessful then a 404 error should be returned.
// Test out your code using the front end. You should see a list of related artists added below the artist which you search for.