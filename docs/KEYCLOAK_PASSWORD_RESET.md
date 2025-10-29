# Keycloak Password Reset Guide

## Problem

After each deployment, the `ichub-admin` user password is imported from `realm-export.json` with a hashed password, making it impossible to know the original password.

## Solutions

### Option 1: Use the Automated Script (Recommended)

Run the provided script after deployment:

```bash
./scripts/reset-keycloak-password.sh
```

This script will:
- Wait for Keycloak to be ready
- Get an admin token
- Reset the `ichub-admin` password to `admin123`

### Option 2: Manual Reset (Fallback)

If the automated solutions don't work, you can manually reset the password:

```bash
# 1. Get admin token
TOKEN=$(curl -s -X POST "http://keycloak-hostname/auth/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=keycloak-admin-password" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

# 2. Reset password
curl -s -X PUT "http://keycloak-hostname/auth/admin/realms/ICHub/users/admin-user-001/reset-password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"password","value":"admin123","temporary":false}'
```

## Configuration

You can customize the `ichub-admin` password by setting an environment variable before running the script:

```bash
export ICHUB_ADMIN_PASSWORD="your-custom-password"
./scripts/reset-keycloak-password.sh
```

## Default Credentials

After running either of the above solutions:

- **Username**: `ichub-admin`
- **Password**: `admin123` (or your custom password)
- **Email**: `ichub-admin@example.com`

## Troubleshooting

### Script fails with "Keycloak not ready"

Increase the timeout or check if Keycloak pods are running:

```bash
kubectl get pods -l app.kubernetes.io/name=keycloak
kubectl logs -l app.kubernetes.io/name=keycloak
```

### Token authentication fails

Verify Keycloak admin credentials:

```bash
kubectl get secret industry-core-hub-keycloak -o yaml
```

### User not found error

Verify the realm was imported correctly:

```bash
kubectl logs -l job-name=industry-core-hub-realm-import
```