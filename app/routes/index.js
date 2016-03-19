var express = require('express');
var router = express.Router();
var nct = require('../core/nct');

/* GET home page. */
router.get('/', function(req, res, next) {
    nct.getSongMetadata('./bin/sample.mp3', function songMetadataRes(err, data) {
        if (err) {
            console.log(err);
        };
        console.log(data);
    })
    res.render('index', {title: 'Express'});
});

router.post('/get-album', function getAlbum(req, res, next) {
    var nctUrl = req.body.musicUrl;

    nct.getAlbum(nctUrl, './bin/tmp/', function getAlbumRes(err, album) {
        if (err) {
            return res.render('index', {errors: err, album: album});
        };

        res.render('index', {album: album});
    });
})

module.exports = router;
