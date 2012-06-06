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
	exten: /^\s*exten\s*=\>\s*(.*?)\s*$/,
	entry: /^\s*(\d+\s*)\,(\d+\s*)\,(.*)\s*$/,
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

module.exports.parseSync = function(file){
	return parse(fs.readFileSync(file, 'utf8'));
};

function parseGeneral(data){
	var value = {};
	var lines = data.split(/\r\n|\r|\n/);
	var section = null;
	lines.forEach(function(line){
		if(regex.comment.test(line)){
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

function parseExtensions(data){
	var value = {};
	var lines = data.split(/\r\n|\r|\n/);
	var section = null;
	lines.forEach(function(line){
		if(regex.comment.test(line)){
			return;
		}else if(regex.exten.test(line)){
			var element = line.match(regex.exten);

			if(regex.entry.test(element[1]))
			{
				item = regex.entry.exec(element[1]);
				if(section){
					if(value[section][item[1]])
					{
						value[section][item[1]][item[2]] = item[3];
					}else{
						value[section][item[1]] = {};
						value[section][item[1]][item[2]] = item[3];
					}
				}else{
					if(value[item[1]])
					{
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
