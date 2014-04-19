// public/core.js
var sectivumFrontEnd = angular.module('sectivumFrontEnd', []);

function sectivumMainController($scope, $location, $http) {

	$scope.formData = {};

	// Stores which page we're currently on.
	$scope.onPage = $location.path().substring(1) || 'home';

	console.log("!trace begins here");

	// console.log("!trace got the nav controller");
    $scope.navClass = function (page) {
    	// console.log("!trace Nav class called page: ",page);
    	console.log("!trace Nav class currentRoute: ",$location.path().substring(1));
        var currentRoute = $location.path().substring(1) || 'home';
        if (currentRoute != $scope.onPage) {
        	$scope.onPage = currentRoute;
        }
        return page === currentRoute ? 'active' : '';
    };

    $scope.switchPage = function (page) {
    	console.log("!trace page request: ",page);
    	$scope.onPage = page;
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

