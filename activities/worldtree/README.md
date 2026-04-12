# World Tree Discord Activity MVP

This is a lightweight Discord Activity shell for the World Tree calculator.

It uses:

- a small React + Vite frontend in this folder
- a tiny Python API at `/activity_api.py`
- your existing Python World Tree math from `commands/worldtree.py`

## What you need to do

### 1. Install backend deps

From the repo root:

```powershell
pip install -r requirements-activity.txt
```

### 2. Start the Python API

From the repo root:

```powershell
python activity_api.py
```

That starts the API at `http://127.0.0.1:8000`.

### 3. Install frontend deps

PowerShell blocks `npm.ps1` on your machine right now, so use:

```powershell
cmd /c npm install
```

Run that inside this folder:

```powershell
cd activities/worldtree
cmd /c npm install
```

### 4. Set frontend env vars

Copy `.env.example` to `.env` and set:

- `VITE_DISCORD_CLIENT_ID`
- `VITE_WT_API_BASE_URL`

Example:

```env
VITE_DISCORD_CLIENT_ID=123456789012345678
VITE_WT_API_BASE_URL=http://127.0.0.1:8000
```

### 5. Start the frontend

Inside `activities/worldtree`:

```powershell
cmd /c npm run dev
```

That starts the app at `http://127.0.0.1:5173`.

## Discord Developer Portal setup

In your Discord application:

1. Enable Activities / Embedded App support.
2. Add your Activity URL mapping.
3. Point the mapped URL to your frontend host.
4. For local testing, use your local tunnel/public HTTPS URL instead of localhost.

Typical local flow:

1. Run the API locally on `8000`
2. Run the frontend locally on `5173`
3. Expose the frontend with HTTPS using a tunnel tool
4. Put that HTTPS URL in the Discord app Activity config

## Current scope

This MVP already supports:

- all main WT inputs
- mode toggles
- sorting
- top build result
- recommended nodes
- alternate builds

This MVP does not yet include:

- saved state
- true Discord launch command wiring
- polished mobile-first layout inside Discord
- shared/multiplayer behavior

## Fastest next improvements

- add saved presets
- add copy buttons for node strings
- add launch command wiring
- move pure calculator logic into a shared module
