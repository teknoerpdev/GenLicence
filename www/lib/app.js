angular.module("app",
[
    'ngRoute',
    'app.controller',
    // 'app.db'
])
.config(function($routeProvider)
{ 
    $routeProvider
    .when("/",
    {
        templateUrl : "html/home.html"
    })
    .when("/compAdd",
    {
        templateUrl : "html/compAdd.html"
    })
})