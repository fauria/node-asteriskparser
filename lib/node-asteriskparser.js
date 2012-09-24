/*
 * get the file handler
 */
var fs = require('fs');

/*
 * define the possible values:
 * section: [section]
 * param: key=value
 * comment: ;this is a comment
 */
var regex = {
	section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
	param: /^\s*([\w\.\-\_]+)\s*=\s*(.*?)\s*$/,
	ivr: /^\s*exten\s*=\s*(.*?)\s*$/,
	exten: /^\s*exten\s*=\>\s*(.*?)\s*$/,
	entry: /^\s*(.+\s*)\,([\d|n]\s*)\,(.*)\s*$/,
	comment: /^\s*;.*$/
};

/*
 * parses a .ini file
 * @param: {String} file, the location of the .ini file
 * @param: {Function} callback, the function that will be called when parsing is done
 * @return: none
 */
module.exports.parseGeneral = function(file, callback){
	if(!callback){
		return;
	}
	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			callback(err);
		}else{
			callback(null, parseGeneral(data));
		}
	});
};

module.exports.parseGeneralSync = function(file){
	return parseGeneral(fs.readFileSync(file, 'utf8'));
};

module.exports.parseExtensions = function(file, callback){
	if(!callback){
		return;
	}
	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			callback(err);
		}else{
			callback(null, parseExtensions(data));
		}
	});
};

module.exports.parseExtensionsSync = function(file){
	return parseExtensions(fs.readFileSync(file, 'utf8'));
};

module.exports.parseIVR = function(file, callback){
	if(!callback){
		return;
	}
	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			callback(err);
		}else{
			callback(null, parseIVR(data));
		}
	});
};

module.exports.parseIVRSync = function(file){
	return parseIVR(fs.readFileSync(file, 'utf8'));
};

module.exports.writeGeneral = function(file, data, callback){
	if(!callback){
		return;
	}
	fs.writeFile(file, writeGeneral(data), 'utf8', function(err, data){
		if(err){
			callback(err);
		}else{
			callback(null, true);
		}
	});
};

module.exports.writeIVR = function(file, data, callback){
	if(!callback){
		return;
	}
	fs.writeFile(file, writeIVR(data), 'utf8', function(err, data){
		if(err){
			callback(err);
		}else{
			callback(null, true);
		}
	});
};

module.exports.writeMoh = function(dir, conf, callback){
	var fs = require('fs');
	fs.readdir(dir, function(err, files){
		var obj = {default: {mode: 'files', directory: 'moh'}};
		for(var moh in files){
			if(fs.statSync(dir+files[moh]).isDirectory()){
				obj[files[moh]] = {mode: 'files', directory: files[moh]};
			}
		}
		fs.writeFile(conf, writeGeneral(obj), 'utf8', function(err, data){
			if(err){
				callback(err);
			}else{
				callback(null, true);
			}
		});
	});
}

function writeGeneral(data){
	var block = '';
	var entry = '';
	for (var key in data) {
		block += '['+key+"]\n";
		var obj = data[key];
		for (var attr in obj) {
			if(obj[attr] != ''){
				entry = attr + " = " + obj[attr] + "\n";
				block += entry;
		  	}
		}
		block += "\n";
	}
	return block;
}

function writeIVR(data){
	var block = '';
	var entry = '';
	block += "[voicemenus]\n";
	for (var key in data) {
		block += 'exten = '+key+',1,Goto('+data[key].name+',s,1)'+"\n";
	}
	block += "\n";
	for (var key in data) {
		block += '['+data[key].name+"]\n";
		block += ';'+data[key].label+"\n";
		console.log(data[key]);
		var obj = data[key].data;
		for (var seq in obj) {
			block += 'exten = s,'+seq+','+obj[seq]+"\n";
		}
		block += "\n";
	}
	return block;
}

function parseGeneral(data){
	var value = {};
	var lines = data.split(/\r\n|\r|\n/);
	var section = null;
	lines.forEach(function(line){
		if(regex.comment.test(line) || line == ''){
			return;
		}else if(regex.param.test(line)){
			var match = line.match(regex.param);
			if(section){
				value[section][match[1]] = match[2];
			}else{
				value[match[1]] = match[2];
			}
		}else if(regex.section.test(line)){
			var match = line.match(regex.section);
			value[match[1]] = {};
			section = match[1];
		}else if(line.length == 0 && section){
			section = null;
		};
	});
	return value;
}

function parseIVR_PRIMERO(data){
	var value = {};
	var lines = data.split(/\r\n|\r|\n/);
	var section = null;
	lines.forEach(function(line){
		if(regex.comment.test(line) || line == ''){
			return;
		}else if(regex.ivr.test(line)){
			var match = line.match(regex.param);
			if(section == 'voicemenus'){
				var ivr_name = match[2].split(',')[2].split('(').pop();
				var ivr_extension = match[2].split(',')[0];
				value[ivr_name] = {exten: ivr_extension, data: {}};		
			}else{
				value[section].data[match[2].split(',')[1]] = match[2].split(',')[2];
			}
		}else if(regex.section.test(line)){
			var match = line.match(regex.section);
			section = match[1];
		}else if(line.length == 0 && section){
			section = null;
		};
	});
	var reordered = {};
	for(var name in value){
		var exten = value[name].exten;
		reordered[exten] = {name: name, data: value[name].data};
	}
	return reordered;
}

function parseIVR(data){
	var value = {};
	var lines = data.split(/\r\n|\r|\n/);
	var section = null;
	var label = '';
	lines.forEach(function(line){
		if(regex.comment.test(line)){
			var match = line.match(regex.comment);
			label = match[0].split(';')[1];
		}else if(line == ''){
			return;
		}else if(regex.ivr.test(line)){
			var match = line.match(regex.param);
			if(section == 'voicemenus'){
				var ivr_name = match[2].split(',')[2].split('(').pop();
				var ivr_extension = match[2].split(',')[0];
				value[ivr_name] = {exten: ivr_extension, data: {}};		
			}else{
				value[section].data[match[2].split(',')[1]] = match[2].split(',').slice(2).join();
				value[section].label = label;
			}
		}else if(regex.section.test(line)){
			var match = line.match(regex.section);
			section = match[1];
		}else if(line.length == 0 && section){
			section = null;
		};
	});
	var reordered = {};
	for(var name in value){
		var exten = value[name].exten;
		reordered[exten] = {name: name, data: value[name].data, label: value[name].label};
	}
	return reordered;
}

function parseExtensions(data){
	var value = {};
	var lines = data.split(/\r\n|\r|\n/);
	var section = null;
	lines.forEach(function(line){
		if(regex.comment.test(line)){
			return;
		}else if(regex.exten.test(line)){
			var element = line.match(regex.exten);
			if(regex.entry.test(element[1])){
				item = regex.entry.exec(element[1]);
				if(section){
					if(value[section][item[1]]){
						value[section][item[1]][item[2]] = item[3];
					}else{
						value[section][item[1]] = {};
						value[section][item[1]][item[2]] = item[3];
					}
				}else{
					if(value[item[1]]){
						value[item[1]][item[2]] = item[3];
					}else{
						value[item[1]] = {};
						value[item[1]][item[2]] = item[3];
					}	
				}
			}
		}else if(regex.section.test(line)){
			var match = line.match(regex.section);
			value[match[1]] = {};
			section = match[1];
		}else if(line.length == 0 && section){
			section = null;
		};
	});
	return value;
}

module.exports.parseString = parseGeneral;
