# Yoga for Happiness — Attendance Portal

Admin-only web app for managing students and marking weekly yoga class attendance.

## Configuration

Copy the example env file and set the API URL:

```bash
cp .env.example .env
```

Then edit `.env`:

```
VITE_API_URL=http://localhost:4000
```

If `VITE_API_URL` is not set, the app defaults to `http://localhost:4000`.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Usage

1. Navigate to `/login` and sign in with your admin credentials.
2. The token is stored in `localStorage` and all protected routes require it.
3. A `401` response from the API will automatically sign you out and redirect to `/login`.

## Routes

| Path | Description |
|------|-------------|
| `/login` | Admin sign-in |
| `/` | Dashboard — stats + recent sessions |
| `/students` | Student list with search, filters, add/edit |
| `/attendance` | Mark attendance by date |
| `/reports` | Attendance summary with date range |
