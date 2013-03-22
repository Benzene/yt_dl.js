/*
 * yt_dl.js
 * Copyright 2012, Matthieu Riviere, matthieu.riviere@leukensis.org
 * See https://leukensis.org/projects/yt_dl.js/ for information and license
 */

(function() {

/*
 * See https://leukensis.org/projects/hsy/
 */
var hsy = {

    createElt: function(tag, attrs) {
        var elt = document.createElement(tag);
        for (k in attrs) {
            elt.setAttribute(k, attrs[k]);
        }
        return elt;
    },

    appendElt: function(parentElt, tag, content) {
        var elt = document.createElement(tag);
        elt.appendChild(content);
        parentElt.appendChild(elt);
    },

    appendTextElt: function(parentElt, tag, text) {
        this.appendElt(parentElt, tag, document.createTextNode(text));
    },

    createTable: function(headers, accessors, data) {
        var table = document.createElement('table');
        var tr = document.createElement('tr');
        var i,j;
        for (i = 0; i < headers.length; ++i) {
            this.appendTextElt(tr, 'td', headers[i]);
        }
        table.appendChild(tr);
        for (i = 0; i < data.length; ++i) {
            tr = document.createElement('tr');
            for (j = 0; j < accessors.length; ++j) {
                var val = accessors[j](data[i],i);
                this.appendElt(tr, 'td', accessors[j](data[i],i));
            }
            table.appendChild(tr);
        }
        return table;
    },

    createLinkElt: function(text, href, attrs) {
        var a = this.createElt('a', attrs);
        a.setAttribute('href', href);
        var txt = document.createTextNode(text);
        a.appendChild(txt);
        return a;
    }
};

function params_string_to_map(str) {
    str2 = str.split('&');

    ret = {};

    for (var i = 0; i < str2.length; i++) {
	    str3 = str2[i].split('=');
	    if (str3.length != 2) {
		    console.log('Weird parameter: ' + str2[i]);
	    } else {
		    ret[str3[0]] = str3[1];
	    }
    }

    return ret;
};

/*
 * Stolen (with love) from http://stackoverflow.com/questions/649614/xml-parsing-of-a-variable-string-in-javascript
 */
function parseXML(str) {
    var parseXml;

    if (typeof window.DOMParser != "undefined") {
        parseXml = function(xml_str) {
            return ( new window.DOMParser()).parseFromString(xml_str, "text/xml");
        }
    } else {
        throw new Error("No XML parser found !");
    };

    return parseXml(str);
};

function getSubtitlesList(root_url, callback) {
    var list_url = root_url + "&type=list&fmts=1";
    /*var list_url = root_url + "&type=list&tlangs=1&asrs=1&fmts=1";*/

    var reqListener = function() {
        var rep = parseXML(this.responseText);
        var tgt = rep.documentElement.childNodes;

        var subtitles = {};
        subtitles.root_url = root_url;
        subtitles.fmt = [];
        subtitles.lang = [];
        for (var i = 0; i < tgt.length; ++i) {
            if (tgt[i].nodeName === "track") {
                subtitles.lang.push({
                    id: tgt[i].getAttribute('id'),
                    name: tgt[i].getAttribute('name'),
                    lang_code: tgt[i].getAttribute('lang_code'),
                    lang_translated: tgt[i].getAttribute('lang_translated')
                });
            } else if (tgt[i].nodeName = "format") {
                subtitles.fmt.push(tgt[i].getAttribute('fmt_code'));
            }
        }

        callback(subtitles);
    };

    var req = new XMLHttpRequest();
    req.onload = reqListener;
    req.open("get", list_url, true);
    req.send();
};

function genSubtitlesUrl(root_url, format, lang, name) {
    return root_url + '&type=track&fmt=' + format + '&lang=' + lang + '&name=' + name;
};

function getVars() {
	var fv1 = document.embeds[0].getAttribute('flashvars');
	var fv3 = params_string_to_map(fv1);

    ctxt = {};
    ctxt.title = decodeURIComponent(fv3['title']);

	var fmt_list_raw = decodeURIComponent(fv3['fmt_list']).split(',');
	var fmt_list = {};
	for (j = 0; j < fmt_list_raw.length; j++) {
		fmt_list_raw2 = fmt_list_raw[j].split('/');
		fmt_list[fmt_list_raw2[0]] = fmt_list_raw2[1];
	}

	var fv4 = decodeURIComponent(fv3['url_encoded_fmt_stream_map']).split(',');

	var fv5 = [];
	for (j = 0; j < fv4.length; j++) {
		fv5[j] = params_string_to_map(fv4[j]);
		fv5[j]['real_url'] = decodeURIComponent(fv5[j]['url']) + '&signature=' + fv5[j]['sig'];
		fv5[j]['type'] = decodeURIComponent(fv5[j]['type']);
		
		var fmt = fv5[j]['type'].split(';')[0].split('/')[1];
		if (fmt == "mp4" || fmt == "webm") {
			fv5[j]['extension'] = '.' + fmt;
		} else if (fmt == "x-flv") {
			fv5[j]['extension'] = ".flv";
		} else if (fmt == "3gpp") {
			fv5[j]['extension'] = ".3gp";
		} else {
			fv5[j]['extension'] = "";
		}

		fv5[j]['resolution'] = fmt_list[fv5[j]['itag']];
	}

    getSubtitlesList(decodeURIComponent(fv3['ttsurl']), function(subtitles) {
        createLayout(ctxt, fv5, subtitles);
    });

};

/* At this point, we have everything. We just need to make it pretty */
function createLayout(ctxt, vars, subtitles) {
    var root_div = document.createElement('div');
    
    hsy.appendTextElt(root_div, 'h3', ctxt.title);

    root_div.appendChild(hsy.createTable(
            ['Id', 'Resolution', 'Type', 'Link'],
            [
                function(d,i) { return document.createTextNode(i+1); },
                function(d,i) { return document.createTextNode(d['resolution']); },
                function(d,i) { return document.createTextNode(d['type']); },
                function(d,i) { return hsy.createLinkElt('Download', d['real_url'], {target: '_blank', download: ctxt.title + d['extension']}); }
            ],
            vars));

    hsy.appendTextElt(root_div, 'h4', 'Subtitles');
    hsy.appendTextElt(root_div, 'p', "If you don't know what you need, you probably need the srt files. '0' is the native Youtube xml format.");

    root_div.appendChild(hsy.createTable(
                ['Id', 'Name', 'Language', 'Links'],
                [
                    function(d,i) { return document.createTextNode(d['id']); },
                    function(d,i) { return document.createTextNode(d['name']); },
                    function(d,i) { return document.createTextNode(d['lang_translated']); },
                    function(d,i) { 
                        var p = document.createElement('p');
                        for (var j = 0; j < subtitles.fmt.length; ++j) {
                            p.appendChild(hsy.createLinkElt(subtitles.fmt[j], genSubtitlesUrl(subtitles.root_url, subtitles.fmt[j], d['lang_code'], d['name']), {target: '_blank', download: ctxt.title + '.' + subtitles.fmt[j]}));
                            p.appendChild(document.createTextNode(' '));
                        }
                        return p;
                    }
                ],
                subtitles.lang));

    hsy.appendTextElt(root_div, 'p', "For any comments, updates, bugs, feedback, see https://leukensis.org/projects/yt_dl.js/");

	newWindow.document.body.appendChild(root_div); 
}; 

var title = document.title;
var newWindow = window.open('', title);
newWindow.document.title = title;

getVars();

return 0;
})();
