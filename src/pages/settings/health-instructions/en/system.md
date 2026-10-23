Kai Studio must be able to run its local backend and write generated files after the desktop install.

### Fix

1. Close Kai Studio and open it again from the installed desktop shortcut so the bundled backend starts cleanly.
2. If Windows Firewall asks for permission, allow localhost/private network access.
3. Open Settings -> Data and choose a writable folder. Avoid `Program Files` or other protected folders.
4. Check the current generated folder: `{{GENERATED_DIR}}`.
5. Save settings, restart the app, then click Check again.
