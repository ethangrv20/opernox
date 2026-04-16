$r = Invoke-WebRequest 'https://mc.opernox.com/api/monitor/keywords' -Method GET
$r.StatusCode
$r.Headers['Access-Control-Allow-Origin']
