function compAddCtrl ($scope)
{
    $scope.init = function()
    {
        $scope.taxNumber = ""
        $scope.title = ""
        $scope.email = ""
        $scope.phone = ""
        $scope.adress = ""     
        $scope.status = ""   
    }
    $scope.btnSave = async function()
    {
        $scope.status = ""

        let tmpRaw = JSON.stringify(
        {
            "title":$scope.title,
            "taxNumber":$scope.taxNumber,
            "adress":$scope.adress,
            "mail":$scope.email,
            "phone":$scope.phone
        })
        let tmpReqOpt = 
        {
            method: 'POST',
            body: tmpRaw,
            redirect: 'follow',
            headers: 
            {
                "Content-Type": "application/json",
                "Authorization" : "Bearer " + window.sessionStorage.getItem('token')
            }
        };
        let tmpFetch = await fetch("/companySave", tmpReqOpt)
        let tmpResult = JSON.parse((await tmpFetch.text()))

        if(tmpResult.message == 'Company has been successfully created')
        {
            $scope.status = "Kayıt işlemi başarılı."            
            $scope.taxNumber = ""
            $scope.title = ""
            $scope.email = ""
            $scope.phone = ""
            $scope.adress = ""  
        }
        else
        {
            $scope.status = "Kayıt işlemi başarısız! - " + tmpResult.message 
        }

        $scope.$apply()
    }
}