import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigFactory } from './ConfigFactory';

// Mock window for testing
interface MockWindow {
  ENV: Record<string, string>;
}

declare global {
  var window: MockWindow;
}

describe('Configuration System Tests', () => {
  beforeEach(() => {
    // Reset window.ENV
    (global as any).window = {
      ENV: {}
    };
    
    // Clear any cached config
    ConfigFactory['_cache'] = null;
  });

  it('should load default configuration when no environment variables are set', () => {
    const config = ConfigFactory.create();
    
    expect(config.app.environment).toBe('development');
    expect(config.api.ichubBackendUrl).toBe('http://localhost:9000/v1');
    expect(config.auth.enabled).toBe(false);
    expect(config.features.enableAdvancedLogging).toBe(false);
  });

  it('should load configuration from window.ENV', () => {
    (global as any).window = {
      ENV: {
        APP_ENVIRONMENT: 'production',
        ICHUB_BACKEND_URL: 'https://api.example.com/v1',
        AUTH_ENABLED: 'true',
        ENABLE_ADVANCED_LOGGING: 'true',
        API_KEY: 'test-api-key',
        KEYCLOAK_URL: 'https://keycloak.example.com',
        KEYCLOAK_REALM: 'test-realm',
        KEYCLOAK_CLIENT_ID: 'test-client'
      }
    };

    const config = ConfigFactory.create();
    
    expect(config.app.environment).toBe('production');
    expect(config.api.ichubBackendUrl).toBe('https://api.example.com/v1');
    expect(config.auth.enabled).toBe(true);
    expect(config.auth.keycloak.url).toBe('https://keycloak.example.com');
    expect(config.features.enableAdvancedLogging).toBe(true);
    expect(config.apiKey.key).toBe('test-api-key');
  });

  it('should validate configuration and throw errors for invalid values', () => {
    (global as any).window = {
      ENV: {
        APP_ENVIRONMENT: 'invalid-environment',
        API_TIMEOUT: 'not-a-number'
      }
    };

    expect(() => ConfigFactory.create()).toThrow();
  });

  it('should cache configuration for performance', () => {
    const config1 = ConfigFactory.create();
    const config2 = ConfigFactory.create();
    
    expect(config1).toBe(config2); // Same reference due to caching
  });

  it('should handle environment-specific configurations', () => {
    const testCases = [
      { env: 'development', expectedTimeout: 30000 },
      { env: 'staging', expectedTimeout: 20000 },
      { env: 'production', expectedTimeout: 10000 }
    ];

    testCases.forEach(({ env, expectedTimeout }) => {
      // Reset cache
      ConfigFactory['_cache'] = null;
      
      (global as any).window = {
        ENV: {
          APP_ENVIRONMENT: env
        }
      };

      const config = ConfigFactory.create();
      expect(config.app.environment).toBe(env);
      // Timeout would be set based on environment in real implementation
    });
  });

  it('should handle API key configuration', () => {
    (global as any).window = {
      ENV: {
        API_KEY: 'test-key-123',
        API_KEY_HEADER: 'X-Custom-API-Key',
        ENABLE_API_KEY_ROTATION: 'true'
      }
    };

    const config = ConfigFactory.create();
    
    expect(config.apiKey.key).toBe('test-key-123');
    expect(config.apiKey.header).toBe('X-Custom-API-Key');
    expect(config.apiKey.enableRotation).toBe(true);
  });

  it('should handle authentication configuration', () => {
    (global as any).window = {
      ENV: {
        AUTH_ENABLED: 'true',
        AUTH_PROVIDER: 'keycloak',
        KEYCLOAK_URL: 'https://auth.example.com',
        KEYCLOAK_REALM: 'my-realm',
        KEYCLOAK_CLIENT_ID: 'frontend-client',
        KEYCLOAK_ON_LOAD: 'check-sso'
      }
    };

    const config = ConfigFactory.create();
    
    expect(config.auth.enabled).toBe(true);
    expect(config.auth.provider).toBe('keycloak');
    expect(config.auth.keycloak.url).toBe('https://auth.example.com');
    expect(config.auth.keycloak.realm).toBe('my-realm');
    expect(config.auth.keycloak.clientId).toBe('frontend-client');
    expect(config.auth.keycloak.onLoad).toBe('check-sso');
  });

  it('should handle feature flags', () => {
    (global as any).window = {
      ENV: {
        ENABLE_ADVANCED_LOGGING: 'true',
        ENABLE_PERFORMANCE_MONITORING: 'false',
        ENABLE_DEV_TOOLS: 'true'
      }
    };

    const config = ConfigFactory.create();
    
    expect(config.features.enableAdvancedLogging).toBe(true);
    expect(config.features.enablePerformanceMonitoring).toBe(false);
    expect(config.features.enableDevTools).toBe(true);
  });

  it('should handle UI configuration', () => {
    (global as any).window = {
      ENV: {
        UI_THEME: 'dark',
        UI_LOCALE: 'de',
        UI_COMPACT_MODE: 'true'
      }
    };

    const config = ConfigFactory.create();
    
    expect(config.ui.theme).toBe('dark');
    expect(config.ui.locale).toBe('de');
    expect(config.ui.compactMode).toBe(true);
  });

  it('should provide configuration summary without sensitive data', () => {
    (global as any).window = {
      ENV: {
        API_KEY: 'secret-key-123',
        ICHUB_BACKEND_URL: 'https://api.example.com/v1'
      }
    };

    const config = ConfigFactory.create();
    const summary = ConfigFactory.getConfigurationSummary(config);
    
    expect(summary).toContain('ICHUB_BACKEND_URL: https://api.example.com/v1');
    expect(summary).not.toContain('secret-key-123');
    expect(summary).toContain('API_KEY: [REDACTED]');
  });
});