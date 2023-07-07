let app = angular.module("app",
[
    'ngRoute',
    'app.controller',
    // 'app.db'
    'dx'
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
    .when("/compList",
    {
        templateUrl : "html/compList.html"
    })
    .when("/licAdd",
    {
        templateUrl : "html/licAdd.html"
    })
    .when("/licList",
    {
        templateUrl : "html/licList.html"
    })
    .when("/packAdd",
    {
        templateUrl : "html/packAdd.html"
    })
    .when("/packList",
    {
        templateUrl : "html/packList.html"
    })
})

app.run(function($rootScope) 
{
    $rootScope.$on('$routeChangeStart', function(event, next, current) 
    {
        if(window.sessionStorage.getItem('token') == null && window.location.pathname != '/index.html')
        {
            window.location = "index.html"
        }
    });
});