'use strict';

var async = require('async');
var request = require('request');
var sugar = require('mongoose-sugar');
var prop = require('annofp').prop;

var sortVersions = require('../lib/sort_versions');
var Library = require('../schemas').cdnjsLibrary;


module.exports = function(cb) {
    var url = 'http://api.cdnjs.com/libraries?fields=version,description,homepage,description,keywords,assets,filename,author';

    console.log('Starting to update cdnjs data');

    request.get({
        url: url,
        json: true
    }, function(err, res, data) {
        if(err || !data || !data.results) {
            console.error('Failed to update cdnjs data!', err, data);

            return cb(err);
        }

        console.log('Fetched cdnjs data');

        async.each(data.results, function(library, cb) {
            sugar.getOrCreate(Library, {
                name: library.name
            }, function(err, d) {
                if(err) {
                    return cb(err);
                }

                sugar.update(Library, d._id, {
                    mainfile: library.filename,
                    lastversion: library.version,
                    description: library.description,
                    homepage: library.homepage,
                    author: library.author,
                    assets: library.assets,
                    versions: library.assets && sortVersions(library.assets.map(prop('version')))
                }, cb);
            });
        }, function(err) {
            if(err) {
                console.error(err);

                return cb(err);
            }

            console.log('Updated cdnjs data');

            cb();
        });
    });
};

