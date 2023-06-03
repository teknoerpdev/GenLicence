function login ($scope)
{
    $scope.init = function()
    {
        $scope.userName = ""
        $scope.password = ""
        $scope.status = ""

        if(window.sessionStorage.getItem('token') != null)
        {
            window.location = "main.html"
        }
    }
    $scope.btnLogin = async function()
    {
        $scope.status = ""
        if($scope.userName == '' || $scope.password == '')
        {
            $scope.status = "Kullanıcı veya şifre boş olamaz !"
            return
        }
        
        let tmpRaw = JSON.stringify(
        {
            "login": $scope.userName,
            "pass": $scope.password
        })
        let tmpReqOpt = 
        {
            method: 'POST',
            body: tmpRaw,
            redirect: 'follow',
            headers: 
            {
                "Content-Type": "application/json",
            }
        };

        let tmpFetch = await fetch("/login", tmpReqOpt)
        let tmpResult = JSON.parse((await tmpFetch.text()))

        if(tmpResult.message != 'success')
        {
            $scope.status = "Login işlemi başarısız !"
            $scope.$apply()
        }
        else
        {
            window.sessionStorage.setItem('token',tmpResult.body.accessToken)
            window.location = "main.html"
        }
    }
}