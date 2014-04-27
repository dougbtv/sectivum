
module.exports = function(server,constants,Parser,Compiler,PreProcessor) {

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

		server.get('/api/compile', this.goCompile);
		server.post('/api/compile', this.goCompile);
		server.head('/api/compile', this.goCompile);


	};

	this.serverStart = function() {

		server.listen(constants.SERVER_PORT, function() {
			console.log(server.name + ' listening at ' + server.url);
		});

	}

	this.goCompile = function(req, res, next) {

		// console.log(req.params);

		var return_json = [
			{text: "this and that"},
			{text: "the other thing"},
			{text: "final"}
		];

		var preprocessor = new PreProcessor();
		var parser = new Parser();
		var compiler = new Compiler();

		preprocessor.loadFile(req.params.input,true,function(err){

			// Trace any preprocessor errors.
			if (err) {
			
				console.log("!trace error compiling from server: ", err); 
			
				// Return a JSON result.
				res.contentType = 'json';
				res.send({err: err.toString()});

			} else {

				parser.parSecInitialize(preprocessor.processed_file,preprocessor.stringers);
				var built_asm = compiler.assemble(compiler.compile_expr(parser.ast));
				
				for (var asmidx = 0; asmidx < built_asm.length; asmidx++) {
					var each = built_asm[asmidx];
					if (typeof each != 'string') {
						built_asm[asmidx] = each.toString();
					}
				}

				var asm_text = built_asm.join(" ");


				var return_json = {

					asm: built_asm,
					asm_text: asm_text,

				};



				// Return a JSON result.
				res.contentType = 'json';
				res.send(return_json);


			}

		}.bind(this));
		
	}.bind(this);


	this.testFunction = function(req, res, next) {

		// console.log(req.params);

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