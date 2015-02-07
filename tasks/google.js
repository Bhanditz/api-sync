'use strict';

var path = require('path')

  , cheerio = require('cheerio')
  , request = require('request')

  , log = require('../lib/log')
  , mail = require('../lib/mail');



module.exports = function() {
    return function(cb) {
        request.get({
            url: 'https://developers.google.com/speed/libraries/devguide'
        }, function(err, res, data) {
            if(err || !data) {
              var s = 'Failed to update google data!';
              log.err(s, err, data);
              mail.error(s);
              return cb(err);
            }

            log.info('Fetched google data');
            cb(null, scrape(data));
        });
    };
};

function scrape(data) {
    var $ = cheerio.load(data);
    var libs = $('div[itemprop="articleBody"] div');
    var ret = [];

    libs.each(function(i, e) {
        var $e = $(e);
        var dd = $e.find('dd');
        var mainfile = $e.find('code').text().split('"').slice(-2, -1)[0].split('/').slice(-1)[0];
        var name = $e.find('code').text().split('"').slice(-2, -1)[0].split('/')[5];
        var versions = getVersions($(dd[2])).concat(getVersions($(dd[3]))).sort();
        var hasMin = $e.find('code').text().indexOf('.min.js') !== -1;

        ret.push({
            name: name,
            mainfile: mainfile,
            homepage: $(dd[1]).find('a').attr('href'),
            assets: getAssets(mainfile, versions, hasMin),
            versions: versions
        });
    });

    return ret;
}

function getVersions($e) {
    return $e.find('.versions').text().split(',').filter(id).map(trim);
}

function getAssets(mainfile, versions, hasMin) {
    var name = path.basename(path.basename(mainfile, path.extname(mainfile)), '.min');
    var extensions = ['js'];

    if(hasMin) {
        extensions.push('min.js');
    }

    return versions.reverse().map(function(version) {
        return {
            version: version,
            files: extensions.map(function(extension) {
                return name + '.' + extension;
            })
        };
    });
}

function trim(s) {
    return s.trim();
}

function id(a) {
    return a;
}
