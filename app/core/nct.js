const request = require('request')
const cheerio = require('cheerio')
const async = require('async')
const fs = require('fs')
const ffmetadata = require('ffmetadata')
const http = require('http')

const DEFAULT_DOWNLOAD_URL = 'http://www.nhaccuatui.com/download/song/'
const STATUS_OK = 200

exports.getAlbum = function (url, relativePath, callback) {
    if (typeof(relativePath) == 'function') {
        callback = relativePath;
        relativePath = '';
    };

    var tmp = url.split('/');
    var albumName = Date.now().toString(); //Default album name is the current timestamp
    if (tmp[3] == 'playlist') {
        albumName = tmp[4].split('.')[0];
    };

    request.get(url, function requestRes(err, res, body) {
        if (err) {
            return callback(err)
        }

        var $ = cheerio.load(body)
        var keys = []
        $('.list_song_in_album li').each(function iterItem(i, item) {
            var key = $(item).attr('key')
            keys.push(key)
        })

        var errors = []
        var downloadUrls = []
        async.each(keys, function iterKey(key, callback) {
            getDownloadUrl(key, function gerDownloadUrlRes(err, downloadUrl) {
                if (err) {
                    errors.push(err);
                    return callback();
                };

                downloadUrls.push(downloadUrl);
                return callback();
            })
        }, function iterKeyError(err) {
            if (errors.length > 0 && downloadUrls.length == 0) {
                return callback(errors);
            };

            var albumDir = relativePath + albumName;
            fs.mkdir(albumDir, function () {
                async.each(downloadUrls, function iterUrl(url, callback) {
                    var tmp = url.split('/');
                    var songName = tmp[tmp.length - 1];
                    var dest = albumDir + '/' + songName;

                    downloadFile(url, dest, function downloadFileRes(err) {
                        return callback(err);
                    })
                }, function iterUrlError (err) {
                    return callback(err, albumName);
                })
            })
        })
    })
}

exports.getSongMetadata = function (path, callback) {
    ffmetadata.read(path, function (err, data) {
        if (err) {
            return callback(err);
        }

        return callback(null, data)
    })
}

var getDownloadUrl = function (key, callback) {
    var requestUrl = DEFAULT_DOWNLOAD_URL + key
    var options = {
        json: true
    }
    var downloadUrl = null

    request.get(requestUrl, options, function requestRes(err, res, jsonBody) {
        if (err) {
            return callback(err);
        }

        if (res.statusCode == STATUS_OK) {
            if (jsonBody.data == null) {
                return callback(new Error(jsonBody.error_message))
            };

            downloadUrl = jsonBody.data.stream_url
        }

        return callback(null, downloadUrl);
    })
}

var downloadFile = function (url, dest, callback) {
    var file = fs.createWriteStream(dest);

    var request = http.get(url, function getSong(res) {
        res.pipe(file);

        file.on('finish', function () {
            file.close(callback);
        })
    }).on('error', function (err) {
        fs.unlink();
        return callback(err);
    })
}