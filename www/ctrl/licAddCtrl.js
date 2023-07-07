function licAddCtrl ($scope)
{
    $scope.init = function() 
    {
        $scope.comp_tax = ""
        $scope.packet = ""
        $scope.mac_id = ""
        $scope.install_key = ""
        $scope.start_date = ""
        $scope.end_date = ""
        $scope.seller = "" 
    }
    $scope.btnSave = async function() 
    {
        
        $scope.status = ""
        
        let tmpRaw = JSON.stringify(
        {
            "comp_tax": $scope.comp_tax,
            "packet": $scope.packet,
            "mac_id": $scope.mac_id,
            "install_key": $scopeinstall_key,
            "startDate": $scope.startDate,  
            "end_date": $scope.endDate,
            "seller": $scope.seller
        })
        
        let tmpResult = await RestRun(tmpRaw, 'POST','licenceSave')
        
        if (tmpResult.message == 'Company has been successfully created') 
        {
            
            $scope.status = "Kayıt işlemi başarılı."
            $scope.comp_tax = ""
            $scope.packet = ""
            $scope.mac_id = ""
            $scope.install_key = ""
            $scope.start_date = ""
            $scope.end_date = ""
            $scope.seller = ""
        } 
        else
        {   
            $scope.status = "Kayıt işlemi başarısız! - " + tmpResult.message
        }
        
        $scope.$apply()
    }
}



