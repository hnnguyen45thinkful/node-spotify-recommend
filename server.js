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
//create our app with express
//create our app with express
var app = express();
//use our public directory with the app
app.use(express.static('public'));
//make the /search/:name route a get request for our app
app.get('/search/:name', function(req, res){
    var relatedTracks;
    var artist;
    //searchReq will run our getFromApi func with a endpoint of search to spotify
    var searchReq = getFromApi('search', {
        //our args object takes in a 'string from user to add to search request'
        q: req.params.name,
        //returns 1 result
        limit: 1,
        //using an artist as a filter for results
        type: 'artist'
    });
    
    //use searchReq's emitter to issue an end event
    searchReq.on('end', function(item){
        //store first item from artist search into artist
        //item is our data from spotify
        artist = item.artists.items[0];
        console.log(artist)
        //create a new request to spotify but this time search for 
        //related artists
        var relatedArtists = getFromApi('artists/'+artist.id+'/related-artists');
        //emit an end call with relatedArtists
        relatedArtists.on('end', function(item){
            //store the artists sent back from spotify in the 
            //related paramater for artist in the search query
            artist.related = item.artists;
            //return the searched for artist and similar artists as json
            var count = 0;
            artist.related.forEach(function(currentArtist){
                var relatedTopTracks = getFromApi('artists/' + currentArtist.id + '/top-tracks?country=US');
                relatedTopTracks.on('end', function(item){
                    currentArtist.tracks = item.tracks;
                    count++;
                    if(count === artist.related.length){
                        res.json(artist);
                    }
                })
                
            })
        });
        relatedArtists.on('error', function(code){
            res.sendStatus(code);
        });
          
    });
    searchReq.on('error', function(code){
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