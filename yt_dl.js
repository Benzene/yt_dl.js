/*
 * yt_dl.js
 * Copyright 2012, Matthieu Riviere, matthieu.riviere@leukensis.org
 */

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
}	

function getVars() {
	var fv1 = document.embeds[0].getAttribute('flashvars');
	var fv3 = params_string_to_map(fv1);

	var fmt_list_raw = unescape(fv3['fmt_list']).split(',');
	var fmt_list = {};
	for (j = 0; j < fmt_list_raw.length; j++) {
		fmt_list_raw2 = fmt_list_raw[j].split('/');
		fmt_list[fmt_list_raw2[0]] = fmt_list_raw2[1];
	}

	var fv4 = unescape(fv3['url_encoded_fmt_stream_map']).split(',');

	var fv5 = [];
	for (j = 0; j < fv4.length; j++) {
		fv5[j] = params_string_to_map(fv4[j]);
		fv5[j]['real_url'] = unescape(fv5[j]['url']) + '&signature=' + fv5[j]['sig'];
		fv5[j]['type'] = unescape(fv5[j]['type']);
		
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

	return fv5;
}

/* At this point, we have everything. We just need to make it pretty */

function createLayout(vars) {
	var table = document.createElement('table');
	var table_header = '<tr><th>Id<\/th><th>Resolution<\/th><th>Type<\/th><th>Link<\/th><\/tr>';
	table.innerHTML = table_header;

	for (var i = 0; i < vars.length; i++) {
		tr = document.createElement('tr');

		td = document.createElement('td');
		txt = document.createTextNode(i+1);
		td.appendChild(txt);
		tr.appendChild(td);

		td = document.createElement('td');
		txt = document.createTextNode(vars[i]['resolution']);
		td.appendChild(txt);
		tr.appendChild(td);

		td = document.createElement('td');
		txt = document.createTextNode(vars[i]['type']);
		td.appendChild(txt);
		tr.appendChild(td);

		td = document.createElement('td');
		a = document.createElement('a');
		a.setAttribute('target','_blank');
		a.setAttribute('href', vars[i]['real_url']);
		/* Manually setting the extension might be useless.. */
		a.setAttribute('download', title + vars[i]['extension']);
		txt = document.createTextNode('Download');
		a.appendChild(txt);
		td.appendChild(a);
		tr.appendChild(td);

		table.appendChild(tr);
	}

	return table; 
}; 


var title = document.title;
var newWindow = window.open('', title);
newWindow.document.title = title;
newWindow.document.body.appendChild(createLayout(getVars()));

void(0);
