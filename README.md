# Cindrella The Family Spa Management

React single-page app for managing spa services, billing and staff. Uses Bootstrap 5, localStorage for persistence and jsPDF/html2canvas for PDF bill generation.

Shop Info:

- Name: Cindrella The Family Spa
- Location: Near IDBI Bank, Queen Place 2nd Floor
- Mobile: 7440534727
- Email: cindrellathefamilyspa@gmail.com

Quick start:

1. Install dependencies

```powershell
npm install
```

2. Start the dev server

```powershell
npm start
```

Files:

- `src/components` - Sidebar and Topbar
- `src/pages` - Dashboard, Billing, Services, Staff
- `src/data` - Services list
- `src/utils` - localStorage helpers and PDF generator

Notes:

- Data is stored in localStorage under keys `bills` and `staff`.
- PDF opens in a new browser tab when a bill is generated.
