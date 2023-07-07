function packAddCtrl ($scope)
{
    $scope.init = function()
    {
        $scope.name = ""
        $scope.app = ""
        $scope.menu = ""
        $scope.userCount = ""
        $scope.option = ""     
    }
    $scope.btnSave = async function()
    {
        console.log(1)
        $scope.status = ""
        
        let tmpRaw = JSON.stringify(
        {
            "name":$scope.name,
            "app":$scope.app,
            "menu":$scope.menu,
            "userCount":$scope.userCount,
            "option":$scope.option
            
        })
        
        let tmpResult = await RestRun(tmpRaw,'POST','packetSave')
        console.log(tmpResult)
        if(tmpResult.message == 'Packet has been successfully created')
        {
            $scope.status = "Kayıt işlemi başarılı."            
            $scope.name = ""
            $scope.app = ""
            $scope.menu = ""
            $scope.userCount = ""
            $scope.option = ""  
        }
        else
        {
            $scope.status = "Kayıt işlemi başarısız! - " + tmpResult.message 
        }

        $scope.$apply()
    }
}