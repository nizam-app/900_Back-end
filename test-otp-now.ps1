# Test OTP for phone number 01718981009
$phone = "01718981009"
$serverUrl = "http://localhost:4000"

Write-Host "Testing OTP System" -ForegroundColor Cyan
Write-Host "Phone: $phone" -ForegroundColor White
Write-Host "Server: $serverUrl" -ForegroundColor White
Write-Host ""

# Step 1: Send OTP
Write-Host "1. Sending OTP..." -ForegroundColor Yellow
$sendBody = @{
    phone = $phone
    type = "REGISTRATION"
} | ConvertTo-Json

try {
    $sendResponse = Invoke-RestMethod -Uri "$serverUrl/api/otp/send" -Method Post -Body $sendBody -ContentType 'application/json'
    
    Write-Host "OTP sent successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $sendResponse | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($sendResponse.code) {
        Write-Host ""
        Write-Host "OTP Code: $($sendResponse.code)" -ForegroundColor Yellow
        Write-Host "Check phone $phone for SMS message" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Waiting 3 seconds before testing verification..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
        
        # Step 2: Verify OTP
        Write-Host ""
        Write-Host "2. Testing OTP verification..." -ForegroundColor Yellow
        $verifyBody = @{
            phone = $phone
            code = $sendResponse.code
            type = "REGISTRATION"
        } | ConvertTo-Json
        
        try {
            $verifyResponse = Invoke-RestMethod -Uri "$serverUrl/api/otp/verify" -Method Post -Body $verifyBody -ContentType 'application/json'
            
            Write-Host "OTP verification successful!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Verification Response:" -ForegroundColor Cyan
            $verifyResponse | ConvertTo-Json -Depth 10 | Write-Host
            Write-Host ""
            Write-Host "All tests passed! OTP system is working correctly." -ForegroundColor Green
        } catch {
            Write-Host "OTP verification failed" -ForegroundColor Red
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Test Summary:" -ForegroundColor Cyan
    Write-Host "  Phone: $phone" -ForegroundColor White
    Write-Host "  OTP Send: Success" -ForegroundColor Green
    Write-Host "  SMS Status: $($sendResponse.smsStatus)" -ForegroundColor White
    if ($sendResponse.smsStatus -eq "sent") {
        Write-Host "  OTP is working correctly!" -ForegroundColor Green
    } else {
        Write-Host "  SMS not sent - check BulkGate credits" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Failed to send OTP" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "  - Server not running on port 4000"
    Write-Host "  - Database connection issue"
    Write-Host "  - Network connectivity problem"
}
