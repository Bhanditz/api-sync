'use strict';

var async = require('async');
var request = require('request');
var sugar = require('mongoose-sugar');

var sortVersions = require('../../lib/sort_versions');
var Library = require('../../schemas').jsdelivrLibrary;


module.exports = function(cb) {
    var url = 'http://www.jsdelivr.com/packagesmain.php';

    console.log('Starting to update jsdelivr data');

    request.get({
        url: url,
        json: true
    }, function(err, res, data) {
        if(err || !data || !data.package) {
            console.error('Failed to update jsdelivr data!', err, data);

            return cb(err);
        }

        console.log('Fetched jsdelivr data');

        async.each(data.package, function(library, cb) {
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

            console.log('Updated jsdelivr data');

            cb();
        });
    });
};

