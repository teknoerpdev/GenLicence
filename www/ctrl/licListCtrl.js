function licListCtrl ($scope)
{
    async function getData()
    {
        let tmpRaw = JSON.stringify(
        {
            "taxNumber":"",
        })

        let tmpResult = await RestRun(tmpRaw,"POST","getLicence")

        console.log(tmpResult)
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
                dataField: 'COMP_TAX',
                caption: 'Vergi No',
            },
            {
                dataField: 'PACKET',
                caption: 'Paket',
            },
            {
                dataField: 'MAC_ID',
                caption: 'Mac_ID',
            },
            {
                dataField: 'INSTALL_KEY',
                caption: 'Key',
            },
            {
                dataField: 'START_DATE',
                caption: 'start_date',
            },
            {
                dataField: 'END_DATE',
                caption: 'end_date',
            },
            {
                dataField: 'SELLER',
                caption: 'SELLER',
            },],
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
        }
        $scope.$apply()
    }
}