function compAddCtrl ($scope)
{
    $scope.init = function()
    {
        $scope.taxNumber = ""
        $scope.title = ""
        $scope.email = ""
        $scope.phone = ""
        $scope.adress = ""     
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
        
        let tmpResult = await RestRun(tmpRaw,'POST','companySave')

        if(tmpResult.success)
        {
            $scope.taxNumber = ""
            $scope.title = ""
            $scope.email = ""
            $scope.phone = ""
            $scope.adress = ""  

            Swal.fire(
                'Kayıt işlemi başarılı!',
                tmpResult.message,
                'success'
            )          
        }
        else
        {
            Swal.fire(
                'Kayıt işlemi başarısız!',
                tmpResult.message,
                'error'
            )
        }

        $scope.$apply()
    }
}