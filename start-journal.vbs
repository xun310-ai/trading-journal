Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d ""C:\Users\旬\Downloads\shanhan-agent\trading-journal"" && npm run dev", 0, False
