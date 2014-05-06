'use strict';

var fp = require('annofp');
var not = fp.not;
var prop = fp.prop;
var values = fp.values;

var utils = require('../../lib/utils');
var contains = utils.contains;
var is = utils.is;
var startsWith = utils.startsWith;


module.exports = function(github) {
    return function(cb) {
        getFiles(function(err, files) {
            if(err) {
                return cb(err);
            }

            cb(null, parse(files));
        });
    };

    function parse(files) {
        var ret = {};

        files.forEach(function(file) {
            var parts = file.split('/');
            var name = parts[0];
            var version = parts[1];
            var filename = parts.slice(2).join('/');

            if(!(name in ret)) {
                ret[name] = {
                    name: name,
                    versions: [],
                    assets: {} // version -> assets
                };
            }

            var lib = ret[name];

            // version
            if(lib.versions.indexOf(version) === -1) {
                lib.versions.push(version);
            }

            // assets
            if(!(version in lib.assets)) {
                lib.assets[version] = [];
            }

            lib.assets[version].push(filename);
        });

        return values(ret).map(function(v) {
            // convert assets to v1 format
            var assets = [];

            fp.each(function(version, files) {
                assets.push({
                    version: version,
                    files: files
                });
            }, v.assets);

            v.assets = assets;

            return v;
        });
    }

    function getFiles(cb) {
        github.repos.getContent({
            user: 'maxcdn',
            repo: 'bootstrap-cdn',
            path: ''
        }, function(err, res) {
            if(err) {
                return cb(err);
            }

            var sha = res.filter(function(v) {
                return v.name === 'public';
            })[0].sha;

            github.gitdata.getTree({
                user: 'maxcdn',
                repo: 'bootstrap-cdn',
                sha: sha,
                recursive: 1
            }, function(err, res) {
                if(err) {
                    return cb(err);
                }

                if(!res.tree) {
                    return cb(new Error('Missing tree'));
                }

                // mode, 100644 === blob that is file
                cb(null, res.tree.filter(is('mode', '100644')).map(prop('path')).
                    filter(contains('/')).
                    filter(not(startsWith('images/'))).
                    filter(not(startsWith('stylesheets/'))));
            });
        });
    }
};
