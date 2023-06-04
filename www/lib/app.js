let app = angular.module("app",
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
    .when("/compList",
    {
        templateUrl : "html/compList.html"
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