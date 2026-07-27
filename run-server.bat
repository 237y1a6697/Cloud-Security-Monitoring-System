@echo off
echo ========================================================================
echo SentinelCore SecureOps - Starting Backend Server with SMTP Configuration
echo ========================================================================
set SMTP_HOST=smtp.gmail.com
set SMTP_PORT=587
set SMTP_USERNAME=prashanthkavuri019@gmail.com
set SMTP_PASSWORD=oueaoaswgczumcns
echo SMTP environment variables set successfully.
echo Launching Spring Boot...
call mvnw.cmd spring-boot:run
