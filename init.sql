CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'agent', -- "admin" or "agent"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    price INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mock Data (only works on first initialization from scratch)
-- Users will be seeded by the backend on startup if they don't exist to ensure correct hashing.


INSERT INTO leads (name, phone, email, status, assigned_to) VALUES 
('Alice Smith', '555-0101', 'alice@example.com', 'New', 2),
('Bob Johnson', '555-0202', 'bob@example.com', 'Contacted', 2);

INSERT INTO properties (title, price, status, agent_id) VALUES 
('Modern Downtown Apartment', 350000, 'Available', 2),
('Suburban Family Home', 650000, 'Sold', 2);
