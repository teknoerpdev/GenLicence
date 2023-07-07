function compListCtrl ($scope)
{
    async function getData()
    {
        let tmpRaw = JSON.stringify(
        {
            "taxNumber":"",
        })

        let tmpResult = await RestRun(tmpRaw,"POST","getCompany")
        
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
                dataField: 'TAX_NUMBER',
                caption: 'Vergi No',
            },
            {
                dataField: 'TITLE',
                caption: 'Ünvan',
            },
            {
                dataField: 'MAIL',
                caption: 'Mail',
            },
            {
                dataField: 'PHONE',
                caption: 'Telefon',
            },
            {
                dataField: 'ADRESS',
                caption: 'Adres',
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
            onRowRemoved: async function(e)
            {
                let tmpRaw = JSON.stringify({ "taxNumber":e.data.TAX_NUMBER })
                    
                let tmpResult = await RestRun(tmpRaw,'POST','companyDelete')
                if(tmpResult.success)
                {
                    Swal.fire(
                        'Silme işlemi başarılı!',
                        tmpResult.message,
                        'success'
                    )
                }
                else
                {
                    Swal.fire(
                        'Silme işlemi başarısız!',
                        tmpResult.message,
                        'error'
                    )
                }
            },
            onRowUpdated: async function(e)
            {                
                let tmpRaw = JSON.stringify(
                {
                    "title":e.data.TITLE,
                    "taxNumber":e.data.TAX_NUMBER,
                    "adress":e.data.ADRESS,
                    "mail":e.data.MAIL,
                    "phone":e.data.PHONE
                })
                
                let tmpResult = await RestRun(tmpRaw,'POST','companyUpdate')
                if(tmpResult.success)
                {
                    Swal.fire(
                        'Güncelleme işlemi başarılı!',
                        tmpResult.message,
                        'success'
                    )
                }
                else
                {
                    Swal.fire(
                        'Güncelleme işlemi başarısız!',
                        tmpResult.message,
                        'error'
                    )
                }
            }
        };
        $scope.$apply()
    }
}
