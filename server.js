var express = require('express');

var app = express();

app.disable('x-powered-by');

var walmart = require('walmart')('r6ayhezqmahh69sdmx3ugc83');

app.set('port', process.env.PORT || 3000);

var q = require('q');
var _ = require('lodash');
var async = require('async');

// all the http requests are returned as promise
function getReviews(itemId){
    var deferred = q.defer();
    walmart.reviews(itemId).then(function (reviews) {
        deferred.resolve(reviews);
    }, function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
}

function searchText(searchText){
    var deferred = q.defer();
    walmart.search( searchText).then(function (searchResults) {
        deferred.resolve(searchResults);
    }, function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
}

function getRecommendations(itemId){
    var deferred = q.defer();
    walmart.recommendations(itemId).then(function (recommendations) {
        deferred.resolve(recommendations);
    }, function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
}


// // a helper sorting method to sort the review strings
// var chunkRgx = /(_+)|([0-9]+)|([^0-9_]+)/g;
// function naturalCompare(a, b) {
//   var ax = [], bx = [];
//
//   a.replace(chunkRgx, function(_, $1, $2, $3) {
//     ax.push([$1 || "0", $2 || Infinity, $3 || ""])
//   });
//   b.replace(chunkRgx, function(_, $1, $2, $3) {
//     bx.push([$1 || "0", $2 || Infinity, $3 || ""])
//   });
//
//   while(ax.length && bx.length) {
//     var an = ax.shift();
//     var bn = bx.shift();
//     var nn = an[0].localeCompare(bn[0]) ||
//         (an[1] - bn[1]) ||
//         an[2].localeCompare(bn[2]);
//     if(nn) return nn;
//   }
//
//   return ax.length - bx.length;
// }

app.get('/abc', function(req, res) {
    /*
     * The workflow is implemented in a flattened promise chaining and it uses the powerful promises node package 'q'
     * */

    if(req.query.searchtext) {

        searchText(req.query.searchtext)
            .then(function (item) {
                return item.items[0].itemId;
            }, function (error) {
                console.log("error while fetching search result from the api", error);
            })
            .then(function (itemId) {
                return getRecommendations(itemId).then(function (recommendations) {
                    return _.map(recommendations, 'itemId');
                }, function (error) {
                    console.log("error while mapping recommendations itemIds", error);
                });
            }, function (error) {
                console.log("error while fetching recommendations from the api", error);
            })
            .then(function (itemIdArr) {
                var promises = [];
                // it only works for 5 :(
                // if promises are queued for more than five it never resolves
                // I am not sure where the limitation lies??
                // ?? is it Q's limitation
                // or we could do only 5 http calls for a api back to back (async)
                // or needs a better implementation:(
                for (var i = 0; i < 5; i++) {
                    promises[i] = getReviews(itemIdArr[i]);
                }
                return q.all(promises);
            }, function (err) {
                console.log("error while fetching reviews from the api", err)
            }).then(function (response) {
            var reviewArr = [];
            _.each(response, function (review) {
                // need to implement the review sentiment here
                // for now I am returning the review by its overall rating

                // we could reach each and every property on the review to do a sentiment analysis using the
                // sentiment npm package ,
                // and
                // we can write funtion or a way to normalize the various scores from sentiment analysis of the review property
                // and sort it to rank order

                // since overall score for a review represents the sentiment of the review
                // this implementation is returning the array of products which are sorted on the overall rating.
                reviewArr.push({
                    reviewRating: review.reviewStatistics.averageOverallRating,
                    productName: review.name,
                    reviews: review.reviews
                });
            });

            // Simple and quick solution to this problem of sorting the object array by one of the properties on the object using prototype inheritance:
            Array.prototype.sortBy = function (p) {
                return this.slice(0).sort(function (a, b) {
                    return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
                });
            };

            reviewArr = (reviewArr.sortBy('reviewRating')).reverse();
            res.status(200);
            res.send(JSON.stringify({ rankOrderedProducts : reviewArr}));

        });
    }
    else {
        console.log("No search text passed");
        res.status(404);
    res.end();
    }
});


app.listen(app.get('port'), function(){
    console.log('***********Express started on http://localhost:' + app.get('port') + ' press Ctrl-C to terminate');

    console.log
    ( '***********Open your web browser and type a URL with query parameters in this way: ' +
        'http://localhost:3000/abc?searchtext=iphone'
    );


    console.log('***********At any point in the execution, if any api fails or an work flow breaks, ' +
        'check the console you will see error messages printed with the reason');


});