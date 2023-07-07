function packListCtrl ($scope)
{
    async function getData()
    {
        let tmpRaw = JSON.stringify(
        {
            "appName":"",
        })

        let tmpResult = await RestRun(tmpRaw,"POST","getPacket")
        
        if(tmpResult.message == 'success')
        {
            return tmpResult.body
        }
    }
    $scope.init = async function()
    {
        let tmpData = await getData()
        $scope.dataGridOptions = 
        {
            dataSource: tmpData,
            columns: 
            [{
                dataField: 'NAME',
                caption: 'Adı',
            },
            {
                dataField: 'APP',
                caption: 'Uygulama',
            },
            {
                dataField: 'MENU',
                caption: 'Menü',
            },
            {
                dataField: 'USER_COUNTS',
                caption: 'Kullanıcı Sayısı',
            },
            {
                dataField: 'OPTION',
                caption: 'Tercih',
            }],
            showBorders: true,
            showRowLines: true,
            selection: 
            {
                mode: 'single',
            },
            editing: 
            {
                mode: 'cell',
                allowUpdating: true,
                allowDeleting: true,
            },
            onRowRemoved: function(e)
            {
                console.log(e)
            },
            onRowUpdated: function(e)
            {
                console.log(e)
            }
        };
        $scope.$apply()
    }
}
