const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require("body-parser");
const port = 80;
let MathJax = null;

require('mathjax').init({
    loader: {load: ['input/tex', 'input/mml', 'output/svg']}
}).then((mj) => {
    MathJax = mj;
    console.log('MathJax has loaded');
}).catch((err) => console.log(err.message));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static('resources'));

var _getSize = function (t) {
    var first = t.indexOf('height="');
    var last = t.indexOf('ex"', first + 8, t.length);
    var height = t.substring(first + 8, last);

    first = t.indexOf('width="');
    last = t.indexOf('ex"', first + 7, t.length);
    var width = t.substring(first + 7, last);

    first = t.indexOf('vertical-align: -');
    last = t.indexOf('ex', first + 17, t.length);
    var baseline = t.substring(first + 17, last);

    return [height, width, baseline];
};

var format_type = function (input) {
    var mml_stag = new RegExp('<([A-Za-z_]+:)?math', 'm');
    return input.match(mml_stag) ? 'mml' : 'latex';
};

var log = function(v){
    console.log(v.substr(0, 70) + (v.length > 70 ? "..." : ""));  
};

var mml2svg = function (input) {
    input = input.replaceAll("\n", "");
    input = input.replaceAll("\r", "");
    log('INPUT: '+ input);

    let svg;
    if (format_type(input) == 'mml'){
        //input = input.replace('<math ', '<math display="block" ');
        svg = MathJax.mathml2svg(input);
    }else{
        svg = MathJax.tex2svg(input);
    }
    svg = MathJax.startup.adaptor.outerHTML(svg);
    svg = svg.replace('<mjx-container class="MathJax" jax="SVG">', '');
    svg = svg.replace('<mjx-container class="MathJax" jax="SVG" display="true">', '');
    svg = svg.replace('</mjx-container>', '');

    var s = _getSize(svg);
    var ratio = 7.1561;
    //var ratio=7.6;
    svg = svg.replace(s[0] + "ex", s[0] * ratio);
    svg = svg.replace(s[1] + "ex", s[1] * ratio);
    svg = svg.replace("style=", 'wrs:baseline="' + (s[0] - s[2]) * ratio + '" style=');
    svg = svg.replace("height=", 'xmlns:wrs="http://www.wiris.com/xml/cvs-extension" height=');
    return svg;
};

app.get('/', function (req, res) {
    input = req.query.mml;
    if (input == undefined)
        res.sendFile(path.join(__dirname + '/index.html'));
    else {
        res.send(mml2svg(input));
    }
});

app.post('/', function (req, res) {
    var input = req.body.mml;
    res.send(mml2svg(input));
});

app.post('/mathml2content', function (req, resp) {
    var input = req.body.input;
    log('mathml2content: ' + input);
    resp.setHeader('Content-type', 'application/xml;charset=UTF-8');
    resp.setHeader('Access-Control-Allow-Origin', '*');
    resp.send(input);
});

app.post('/mathml2internal', function (req, resp) {
    var input = req.body.mml;
    log('mathml2internal: ' + input);
    resp.setHeader('Content-type', 'application/xml;charset=UTF-8');
    resp.setHeader('Access-Control-Allow-Origin', '*');
    if (input === undefined)
        resp.send('<math/>');
    else
        resp.send(input);
});

app.post('/tick', function (req, resp) {
    log('tick: ');
    resp.setHeader('Access-Control-Allow-Origin', '*');
    resp.send("");
});

app.post('/latex2mathml', function (req, res) {
    var input = req.body.latex;
    log('latex2mathml: ' + input);
    if (input === undefined) {
        res.send('input undefined');
    }

    MathJax.texReset();
    MathJax.tex2mmlPromise(input, {display: true}).then(function (mml) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-type', 'application/xml;charset=UTF-8');
        res.send(mml);
    }).catch(function (err) {
        //  If there was an error, put the message into the output instead
    }).then(function () {
        //  Error or not, re-enable the display and render buttons
    });
});

var run = function () {
    if (MathJax !== null)
        app.listen(port, function () {
            console.log("Your app running on port " + port);
        });
    else {
        console.log("Waiting");
        setTimeout(run, 300);
    }
};
run();
