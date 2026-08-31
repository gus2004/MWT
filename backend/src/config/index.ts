import dotenv from 'dotenv';

dotenv.config();

const config = {
    port: process.env.PORT || 3000,
    db: {
        url: process.env.DATABASE_URL || 'postgres://localhost:5432/mydb',
    },
    // Add other configuration settings as needed
};

export default config;