// -------------------------------------------------------------------------------------------------- 
// Creates a "constants" object with defines
// To use like, well, defined constants, but... pack it up real nice.
// Idea: http://stackoverflow.com/questions/8595509/how-do-you-share-constants-in-nodejs-modules
// -------------------------------------------------------------------------------------------------- 

function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

// ---------------------------------- Debug constants.
define('DEBUG',false);


// ---------------------------------- Utility methods.


// I really would rather have a boolean rather than a -1 for false.
// So I was inspired by: http://stackoverflow.com/questions/11286979/how-to-search-in-an-array-in-node-js-in-a-non-blocking-way

Array.prototype.contains = function(needle) {
   	if (this.indexOf(needle) >= 0) {
   		return true;
	} else {
		return false;
	}
}

// ...same for strings
String.prototype.contains = function(it) { 
	return this.indexOf(it) != -1; 
};

// last item in Array
Array.prototype.last = function() {
    return this[this.length - 1];
}

String.prototype.last = function() {
    return this.substring(this.length - 1,1);
}

String.prototype.first = function() {
    return this.substring(0,1);
}

// And a nickname for test. I like "match"
RegExp.prototype.match = function(needle) {

	return this.test(needle);
}

// Array clone:
// http://davidwalsh.name/javascript-clone-array
Array.prototype.clone = function() {
	return this.slice(0);
};

Object.prototype.hashlength = function() {
	hashlen = Object.keys(this).length
	return hashlen;
}

Object.prototype.contains = function() {
	hashlen = Object.keys(this).length
	return hashlen;
}

Object.prototype.isset = function(property) {
	if (typeof this[property] === 'undefined') {
		return false;
	} else {
		return true;
	}
}
