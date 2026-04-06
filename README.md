# CyberSec Lab

CyberSec Lab is a Node.js web project that combines a cybersecurity-themed static mini-site with a dynamic web application built around virtual train routes, bookings, complaints, and session-based authentication.

The project includes:
- a static educational mini-site about cybersecurity topics
- a small browser game where the player has to find Linus Torvalds
- a dynamic DataTrains-style web app with authentication, route browsing, bookings, complaints, and admin-only features

---

## Tech Stack

- Node.js
- Express
- EJS
- Microsoft SQL Server
- `mssql`
- `express-session`
- `bcrypt`
- `dotenv`
- Vanilla JavaScript
- HTML / CSS

---

## Features

### Static CyberSec Mini-Site

The `public/` folder contains several static pages related to cybersecurity:

- `index.html` – home page / introduction
- `gadgets.html` – cybersecurity gadgets and tools
- `threats.html` – common attack types
- `defense.html` – defense and protection tips
- `game.html` – interactive mini-game

These pages are served as static files by the Express app.

### Authentication

Users can:
- register a new account
- log in
- log out

Authentication is session-based.

### Train Routes

The dynamic part of the project contains a train-route style module called **DataTrains**.

Users can:
- browse all train routes
- search train routes by source server, destination server, and cost range
- open the bookings page of a selected route
- view additional route details through client-side requests

Admin users can:
- create new train routes

### Bookings

Logged-in users can:
- create a booking for a route
- view all bookings for a selected route
- delete only their own bookings
- submit a complaint for their own booking

Each booking stores:
- the selected route
- the user
- packet label
- packet count
- creation time

### Complaints

The project includes a complaint system.

Users can:
- submit complaints for their own bookings

Admin users can:
- open the complaints page
- see a summary grouped by route
- see the full complaints list
- filter complaints on the client side

### Mini Game

The project also includes a small card game: **Find Linus Torvalds**.

Game flow:
- the player enters a nickname
- the player selects starting money
- the player chooses a currency
- in each round the player picks one of three cards
- if the guess is correct, the player wins money
- if the guess is wrong, the player loses money
- the game ends when the player stops or runs out of money

---

## Project Structure

```text
src/
  app.js
  db.js
  middleware/
  repositories/
  routes/
  views/

public/
  index.html
  gadgets.html
  threats.html
  defense.html
  game.html
  game.js
  style.css

database/
  schema.sql
```

---

## Installation and Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Make sure Microsoft SQL Server is installed and running

This project requires a running **Microsoft SQL Server** instance.

### 3. Create the database

Create a database named:

```sql
VonatTarsasag
```

Then run:

```text
database/schema.sql
```

### 4. Configure environment variables

Create a `.env` file based on `.env.example`, then fill in your own values.

Example:

```env
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=VonatTarsasag
DB_ENCRYPT=false
DB_TRUST_SERVER_CERT=true
SESSION_SECRET=change-me
PORT=3000
```

### 5. Start the application

```bash
npm start
```

The server runs on:

```text
http://localhost:3000
```

---

## Admin Note

In the current version of the project, the first created user is treated as the admin.

That means the user with:

```text
FelhasznaloID = 1
```

receives admin privileges.

Admin-only features include:
- creating train routes
- opening the complaints page
- viewing complaint summaries and complaint details

---

## Database Notes

The SQL schema contains these main tables:

- `Felhasznalo`
- `Jarat`
- `Foglalas`
- `Panasz`

The `Felhasznalo` table stores passwords in hashed form using `JelszoHash`.

---

## SQL Server Login Note

The repository includes the database schema only.

A separate SQL Server login creation script such as `CREATE LOGIN ...` is **not required** for the README or the main schema file, because that part depends on the local SQL Server setup of the person running the project.

Users can configure their own SQL Server login and connection settings through the `.env` file.

---

## Security Notes

- Do not upload real database credentials to GitHub.
- Do not upload your real `.env` file.
- Do not place SQL setup files inside `public/`.
- Prefer environment variables for database configuration.
- This project is intended for educational and demonstration purposes.

---

## Author

Created by **Szabó Csenge**
