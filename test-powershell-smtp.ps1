$secpasswd = ConvertTo-SecureString 'oueaoaswgczumcns' -AsPlainText -Force
$mycreds = New-Object System.Management.Automation.PSCredential 'prashanthkavuri019@gmail.com', $secpasswd
try {
    Send-MailMessage -From 'prashanthkavuri019@gmail.com' -To 'prashanthkavuri019@gmail.com' -Subject 'PowerShell SMTP Test' -Body 'This is a test.' -SmtpServer 'smtp.gmail.com' -Port 587 -UseSsl -Credential $mycreds -ErrorAction Stop
    Write-Host "PowerShell SMTPSend Success!"
} catch {
    Write-Host "PowerShell SMTPSend Failed: $_"
    if ($_.Exception.InnerException) {
        Write-Host "Inner exception: $($_.Exception.InnerException.Message)"
    }
}
