@echo off
echo ========================================================================
echo SentinelCore SecureOps - Starting Backend Server with SMTP Configuration
echo ========================================================================
echo WARNING: This file previously contained sensitive credentials which have
echo been removed from the repository. Do NOT commit secrets to source control.
echo To run locally, set the SMTP environment variables securely in your shell.
echo Example (PowerShell):
echo   $env:SMTP_HOST = 'smtp.gmail.com'
echo   $env:SMTP_PORT = '587'
echo   $env:SMTP_USERNAME = '<YOUR_EMAIL>'
echo   $env:SMTP_PASSWORD = '<YOUR_APP_PASSWORD>'
echo Launching Spring Boot...
cd backend
call mvnw.cmd spring-boot:run
