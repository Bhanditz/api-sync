'use strict';

var async = require('async');
var request = require('request');
var sugar = require('mongoose-sugar');

var scrape = require('./scrape');
var sortVersions = require('../../lib/sort_versions');
var Library = require('../../schemas').googleLibrary;


module.exports = function(cb) {
    var url = 'https://developers.google.com/speed/libraries/devguide';

    console.log('Starting to update google data');

    request.get({
        url: url,
    }, function(err, res, data) {
        if(err || !data) {
            console.error('Failed to update google data!', err, data);

            return cb(err);
        }

        console.log('Fetched google data');

        async.each(scrape(data), function(library, cb) {
            sugar.getOrCreate(Library, {
                name: library.name
            }, function(err, d) {
                if(err) {
                    return cb(err);
                }

                library.versions = sortVersions(library.versions);

                sugar.update(Library, d._id, library, cb);
            });
        }, function(err) {
            if(err) {
                console.error(err);

                return cb(err);
            }

            console.log('Updated google data');

            cb();
        });
    });
};

