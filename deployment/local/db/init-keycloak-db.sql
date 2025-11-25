-- Create Keycloak user and database
CREATE USER keycloak WITH PASSWORD 'keycloak';
CREATE DATABASE keycloak WITH OWNER keycloak;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;

-- Connect to keycloak database and grant schema privileges
\c keycloak
GRANT ALL ON SCHEMA public TO keycloak;
