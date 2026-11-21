@echo off
cd /d "%~dp0"
docker info >nul 2>&1
if errorlevel 1 (
  echo Docker Engine is not running. Start Docker Desktop and try again.
  pause
  exit /b 1
)
docker compose config
if errorlevel 1 (pause & exit /b 1)
docker compose up -d
docker compose ps
pause
