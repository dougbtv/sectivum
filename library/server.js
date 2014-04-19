
module.exports = function(server,constants) {

	// --------------------------------------------------------------------
	// -- myConstructor : Throws the constructor into a method.
	// ...Because javascript wants the methods to be defined before referencing them.

	// So you want to interoperate with Apache?
	// Try a directive like so:
	// ProxyPass /api/ http://localhost:8000/api/
	
	this.myConstructor = function() {

		// Method call at the bottom of this class.
	
		server.get('/api/foo', this.testFunction);
		server.post('/api/foo', this.testFunction);
		server.head('/api/foo', this.testFunction);

	};

	this.serverStart = function() {

		server.listen(constants.SERVER_PORT, function() {
			console.log(server.name + ' listening at ' + server.url);
		});

	}

	this.testFunction = function(req, res, next) {

		console.log(req.params);

		var return_json = [
			{text: "this and that"},
			{text: "the other thing"},
			{text: "final"}
		];
		
		// Return a JSON result.
		res.contentType = 'json';
		res.send(return_json);

	}.bind(this);

	// Call the constructor (after defining all of the above.)

	this.myConstructor();

	
}