# Glock Log - Firearm Inventory Management App

A React Native application for tracking firearm inventory, including details like model name, caliber, purchase date, and ammunition counts.

## Features

- Track firearm inventory
- Record purchase details
- Monitor ammunition counts
- Upload firearm photos
- View collection statistics
- Modern UI with Tailwind CSS

## Tech Stack

- Frontend: React Native with TypeScript
- Styling: Tailwind CSS (NativeWind)
- Backend: Bun with Express
- Database: PostgreSQL
- ORM: Prisma

## Prerequisites

- Node.js and npm
- Bun
- PostgreSQL
- React Native development environment

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up the database:

   ```bash
   # Create a PostgreSQL database named 'glock_log'
   # Update the DATABASE_URL in .env if needed
   bun run prisma:generate
   bun run prisma:migrate
   ```

4. Start the backend server:
   ```bash
   bun run dev
   ```

### Frontend Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Run on iOS or Android:
   ```bash
   npm run ios
   # or
   npm run android
   ```

## API Endpoints

- `GET /api/firearms` - Get all firearms
- `GET /api/firearms/:id` - Get a single firearm
- `POST /api/firearms` - Create a new firearm
- `PUT /api/firearms/:id` - Update a firearm
- `DELETE /api/firearms/:id` - Delete a firearm
- `GET /api/firearms/stats/overview` - Get collection statistics

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
