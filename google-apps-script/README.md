# Arm Workout Tracker: Google Sheets setup

1. Create a new Google Spreadsheet.
2. Open **Extensions → Apps Script**.
3. Replace the default code with `Code.gs` from this directory.
4. Choose **Deploy → New deployment → Web app**.
5. Set **Execute as** to yourself and **Who has access** to anyone with the link.
6. Deploy and copy the `/exec` URL.
7. Open `/brain-rot-games/arm-workout` and paste the URL into the settings field.

Each completed set is appended to a sheet named `Workout Log`. The browser also keeps a local copy automatically, and the UI can export CSV or copy JSON for ChatGPT.
