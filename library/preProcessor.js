module.exports = function() {

	// Include the filesystem module.
	this.fs = require('fs');

	this.stringers = []; 		// Our collection of known strings.
	

	this.preprocess = function(applines) {

		// Strip out the comments.
		// TODO: Right now you can't have comments inside a string.
		// It kinda looks like garbage when you do that anyways, so... 
		// My recommendation: Escape comment-like characters in strings.
		applines = this.processRemarks(applines);

		// Get the lines.
		applines = this.processDefines(applines);

		// join the lines provided.
		var input = applines.join("\n");

		// console.log("!trace input: ",input);

		input = this.stringify(input);


		// console.log("!trace stringified -------------------\n%s\n-------------------\n\n",input);
		// console.log("!trace stringers ----\n %j ----\n",this.stringers);


		// Let's remove all whitespace, oooooh.
		re_whitespace = /\s/g;
		input = input.replace(re_whitespace,"");

		// console.log("!trace whitespaced -------------------\n%s\n-------------------\n\n",input);

		return input;

	}

	this.processRemarks = function(applines) {

		var result = [];
		var finding_block = false;
		
		for (var linenumber = 0; linenumber < applines.length; linenumber++) {

			var line = applines[linenumber].trim();

			// Strip blanks
			if (!line.length) {
				continue;
			}

			var re_blockend = /\*\//;
			var re_replacend = /^.*?\*\/(.*)$/;

			// Process comments.
			if (finding_block) {
				// We're finding a block. So, let's see if we found the end.
				if (re_blockend.match(line)) {
					// That's the end.
					// Keep the rest.
					line = line.replace(re_replacend,"$1");
					// And we're not looking for a block anymore.
					finding_block = false;
				} else {
					// Nope, just dump these lines.
					continue;
				}
			}

			// Single line comments.
			var re_singleline = /\/\//;
			var re_singlelinebegins = /^\/\//;
			var re_singlelinereplace = /^(.+?)\/\/.+$/;

			if (re_singleline.match(line)) {
				// If this is at the beginning of the line, ignore the line.
				if (re_singlelinebegins.match(line)) {
					continue;
				} else {
					// There's other stuff on the line, so let's keep that.
					line = line.replace(re_singlelinereplace,"$1").trim();
				}
			}

			// Block comments.
			var re_blockbegin = /\/\*/;
			var re_inlinefound = /\*\//;
			var re_inlinereplace = /^(.*)\/\*.*\*\/(.*)$/;
			var re_blockopenreplace = /^(.*)\/\*.*/;

			if (re_blockbegin.match(line)) {
				// Ok, so we found a comment.
				if (re_inlinefound.match(line)) {
					// That's an inline comment.
					line = line.replace(re_inlinereplace,"$1$2");
				} else {
					// That's a block comment.
					// Keep everything before the opening.
					line = line.replace(re_blockopenreplace,"$1");
					// Note that we're looking for more blocks.
					finding_block = true;
				}
			}

			retrim = line.trim(); 
			if (retrim.length) {
				result.push(retrim);
			}
		}

		return result;

	}

	this.processDefines = function(applines) {

		var defines = {}; // Collection of lines.

		var result = [];  // The processed result

		for (var linenumber = 0; linenumber < applines.length; linenumber++) {

			var line = applines[linenumber].trim();
			
			var re_matchdefine = /^\#define/;
			var re_defineformat = /^\#define\s+[^\s]+\s[^\s]+$/;

			// Collect each define
			if (re_matchdefine.match(line)) {
				// Great, it's a define. Now let's make sure it has all it's parts.
				if (re_defineformat.match(line)) {

					// Great that has all it's parts.
					var re_defname = /^\#define\s+([^\s]+)\s+[^\s]+$/;
					var re_defvalue = /^\#define\s+[^\s]+\s+([^\s]+)$/;
					var defname = line.replace(re_defname,"$1");
					var defvalue = line.replace(re_defvalue,"$1");
					
					defines[defname] = defvalue;

					/* 
					// wasn't cooperating, maybe not necessary.
					var re_recommended = /^[A-Z_]+$/g;
					if (!re_recommended.match(line)) {
						console.log("WARNING: Your define of '" + defname + "' isn't all uppercase or underscores. Which is OK, but, I don't recommend it.\n");
					}
					*/

				} else {

					throw "In line number " + linenumber + " with the define statement of '" + line + "' I can't parse it properly. Sorry\n";

				}


			} else {

				result.push(line);

			}

		} 

		// Run through each define.
		var defkeys = Object.keys(defines);
		for (var defidx = 0; defidx < defkeys.length; defidx++) {

			var re_replacedef = new RegExp(defkeys[defidx],"g");

			var defvalue = defines[defkeys[defidx]];

			// console.log("!def value: ",defvalue);

			// Then through the whole file (what's resulted after stripping #define lines)
			for (var linenumber = 0; linenumber < result.length; linenumber++) {
				// Run through and replace them.
				result[linenumber] = result[linenumber].replace(re_replacedef,defvalue);
			}
		}

		return result;

	}

	this.stringify = function(input) {

		// I think the first thing we do is collect all the strings.
		// But do it multi-line.
		
		var instring = false;	// Are we inside a string right now?
		var strstart = [];		// where's it start?
		var strend = [];		// where's that string end?
		var quoteused = ""; 	// What kind of quote? (you can use single or double quotes)

		var re_quotecharacters = /^['"]/;
		var re_escapechars = /^\\/;

		for (var idx = 0; idx < input.length; idx++) {

			var restof = input.substring(idx,input.length);
			var currentchar = restof.substring(0,1);

			// Any time we see a "\" -- we skip ahead a character.
			// This is our escape, so, rock it.
			if (re_escapechars.match(restof)) {
				idx++;
				continue;
			}

			// So let's find string delimiters ' or "
			if (re_quotecharacters.match(restof)) {
				if (!instring) {
					// Looking to begin
					instring = true;
					strstart.push(idx);
					quoteused = currentchar;
				} else {
					if (currentchar == quoteused) {
						// And we're ending.
						instring = false;
						strend.push(idx);
					}
				}
			}

			
			// console.log("-----------\n%s\n",restof);

		}

		// Now we've collected where the strings start and stop.
		// Keep each string, and replace it with a marker.
		var stringified = "";
		var beginmarker = 0;
		for (stridx = 0; stridx < strstart.length; stridx++) {
			// Set up our boundaries.
			var startpos = strstart[stridx];
			var endpos = strend[stridx];
			// var before = input.substring(beginmarker,(startpos-beginmarker)-1);
			var before = input.substring(beginmarker,startpos);
			var thestring = input.substring(startpos+1,endpos);
			
			/*
				console.log("begin: %d | start: %d | end: %d",beginmarker,startpos,endpos);
				console.log("beforesubstr from: %d - %d",beginmarker,(startpos-beginmarker)-1);
				console.log("thestrsubstr from: %d - %d",startpos+1,endpos);
				console.log("---------- !trace before chunk ---\n%s\n-----\n ",before);
				console.log("---------- !trace thestring chunk: %s\n",thestring);
			*/

			// Increment where to begin.
			beginmarker = endpos + 1;

			// Add a marker in the string.
			var string_identifier = "__STRING__" + this.stringers.length + "_";

			// Create a new known string.
			this.stringers.push(thestring);

			// chunk it together.
			stringified += before + string_identifier;

		}

		// Add the bitter end.
		stringified += input.substring(beginmarker,input.length);

		// Check to see that we're not in a string.
		if (instring) {
			throw "You have an unterminated string. [!todo add where exactly that is.]";
		}

		return stringified;		

	}


	this.loadFile = function(filepath) {


		// Read the file into a string.
		filecontents = this.fs.readFileSync(filepath,{encoding: "ascii"});

		// console.log(filecontents);

		filelines = filecontents.toString().split("\n");
		applines = [];

		for(var lineidx = 0; lineidx < filelines.length; lineidx++) {
			
			// Get each line.
			var line = filelines[lineidx];
			console.log(line);

			// Look for a multi-equals sign, to break chunks of code.
			pattern_equals = /\={3}/;

			if(pattern_equals.test(line)) {
				break;
			}

			// Push this line to 
			applines.push(line);

		}
		
		// sectivum compilin' time!
		
		// Ok preprocess it.
		var processed = this.preprocess(applines);

		// this.ast = this.parSec(processed);

		throw "awesome dude. !trace death";

	}


}