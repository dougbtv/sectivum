// public/core.js
var sectivumFrontEnd = angular.module('sectivumFrontEnd', []);

function sectivumMainController($scope, $location, $http) {

	$scope.formData = {};

	// Stores which page we're currently on.
	$scope.onPage = $location.path().substring(1) || 'home';

	$scope.navClass = function (page) {
    	
        // Get the route.
        var currentRoute = $location.path().substring(1) || 'home';

        // Set the onPage if it's wrong.
        if (currentRoute != $scope.onPage) {
        	$scope.onPage = currentRoute;
        }

        return page === currentRoute ? 'active' : '';
    };

    // Set which page we're on.
    $scope.switchPage = function (page) {
    	$scope.onPage = page;
    }

    // Go ahead and compile the input.
    $scope.hitCompile = function() {

    	console.log($scope.formData);
    	
    	$http.post('/api/compile', $scope.formData)
			.success(function(data) {
				$scope.asm = data.asm;
				$scope.formData.output = data.asm_text;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ',data);
			});

    }

    // Sets the class of the asm output to represent traced items.
    // Check out contextual tables here: http://twitterbootstrap.org/twitter-bootstrap-table-example-tutorial/

    $scope.traceByRegex = function(index) {

    	if (typeof $scope.formData.traceregex != 'undefined' && $scope.formData.traceregex.length) {
    	
	    	var traceregexstring = '' + $scope.formData.traceregex + '';
	    	
	    	try {
	    		var re_trace = new RegExp(traceregexstring,'gi');
	    	} catch (e) {
	    		return "";
	    	}

	    	var eachasm = $scope.asm[index];
	    	
	    	if (eachasm.match(re_trace)) {
	    		return "info";
	    	} else {
	    		return "";
	    	}

    	} else {
    		return "";
    	}
    	


    }

    // Load a sample file, so you can see how it works without having to type in code.

    $scope.sampleFile = function() {

		var sample = '// Set some variables.\n#define FOO 15\n$a = FOO;\n$b = 20;\n// Make a conditional\nif ($b > $a) {\n  $c = 100;\n} else {\n  // Else we do this.\n  $d = "quux";\n}';

		$scope.formData.input = sample;

	}

}

function mainController($scope, $http) {
	$scope.formData = {};

	// when landing on the page, get all todos and show them
	$http.get('/api/foo')
		.success(function(data) {
			$scope.todos = data;
			console.log(data);
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});

	// when submitting the add form, send the text to the node API
	$scope.createTodo = function() {
		$http.post('/api/todos', $scope.formData)
			.success(function(data) {
				$scope.formData = {}; // clear the form so our user is ready to enter another
				$scope.todos = data;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ',data);
			});
	};

	// delete a todo after checking it
	$scope.deleteTodo = function(id) {
		$http.delete('/api/todos/' + id)
			.success(function(data) {
				$scope.todos = data;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	};

}





$(document).ready(function(){
    $("[data-toggle=tooltip]").tooltip({ placement: 'right'});
});




// --------------- shortcut functions
// http://zachsnow.com/#!/blog/2013/angularjs-shortcuts/
