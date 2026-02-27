setlocal enabledelayedexpansion

start /B curl http://localhost:3000/ > NUL 2>&1

set pages=admin kiosk login-admin login-kiosk admin/feedback admin/kitchen admin/modify admin/statistics admin/debug admin/analytics

for %%p in (%pages%) do (
    start /B curl http://localhost:3000/%%p > NUL 2>&1
)
