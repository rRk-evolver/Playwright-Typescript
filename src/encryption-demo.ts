import { DataEncryption } from './utils/encryption/data-encryption';
import { Logger } from './utils/logger';


/**
 * Data Encryption Demo
 * Demonstrates comprehensive data security capabilities
 */
async function demonstrateEncryptionCapabilities() {
  const logger = Logger.getInstance();

  console.log("🔐 Data Encryption & Security Demo");
  console.log("==================================\n");

  try {
    // Initialize encryption handler
    console.log("🔧 Initializing Data Encryption...");
    const encryption = new DataEncryption();
    console.log("✅ Data encryption initialized successfully\n");

    // 1. Basic Encryption/Decryption Demo
    console.log("🔒 Basic Encryption/Decryption:");
    console.log("-------------------------------");

    const sensitiveData = {
      password: "SuperSecretPassword123!",
      apiKey: "sk_live_abc123xyz789",
      creditCard: "4532-1234-5678-9012",
      socialSecurity: "123-45-6789",
    };

    console.log("📝 Original sensitive data:");
    Object.entries(sensitiveData).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    console.log("\n🔐 Encrypting sensitive data...");
    const encryptedData: Record<string, string> = {};

    for (const [key, value] of Object.entries(sensitiveData)) {
      encryptedData[key] = await encryption.encrypt(value);
      console.log(
        `   ✅ ${key} encrypted: ${encryptedData[key].substring(0, 20)}...`
      );
    }

    console.log("\n🔓 Decrypting data back to original:");
    for (const [key, encryptedValue] of Object.entries(encryptedData)) {
      const decryptedValue = await encryption.decrypt(encryptedValue);
      const originalValue = (sensitiveData as any)[key];
      const isMatch = decryptedValue === originalValue;
      console.log(
        `   ${isMatch ? "✅" : "❌"} ${key}: ${decryptedValue} (${isMatch ? "MATCH" : "MISMATCH"})`
      );
    }

    console.log();

    // 2. Data Masking Demo
    console.log("🎭 Data Masking for Logs:");
    console.log("-------------------------");

    const testCredentials = [
      "admin@company.com",
      "SuperSecretPassword123!",
      "4532-1234-5678-9012",
      "sk_live_abc123xyz789def456",
      "very_long_api_key_that_should_be_masked_properly",
    ];

    console.log("📊 Masking sensitive data for safe logging:");
    testCredentials.forEach((credential) => {
      const masked = encryption.maskSensitiveData(credential, 3);
      console.log(`   Original: ${credential}`);
      console.log(`   Masked:   ${masked}`);
      console.log();
    });

    // 3. Hash Generation Demo
    console.log("🔨 Hash Generation:");
    console.log("------------------");

    const dataToHash = [
      "user@example.com",
      "TestPassword123",
      "Important Document Content",
      JSON.stringify({ userId: 12345, role: "admin" }),
    ];

    console.log("📝 Generating SHA-256 hashes:");
    dataToHash.forEach((data) => {
      const hash = encryption.hash(data);
      console.log(
        `   Data: ${data.substring(0, 30)}${data.length > 30 ? "..." : ""}`
      );
      console.log(`   Hash: ${hash}`);
      console.log();
    });

    // 4. Random String Generation Demo
    console.log("🎲 Random String Generation:");
    console.log("----------------------------");

    const randomStrings = [
      { length: 8, purpose: "Short API Key" },
      { length: 16, purpose: "Session Token" },
      { length: 32, purpose: "Encryption Key" },
      { length: 64, purpose: "Secure Hash Salt" },
    ];

    console.log("🔀 Generating random strings:");
    randomStrings.forEach(({ length, purpose }) => {
      const randomString = encryption.generateRandomString(length);
      console.log(`   ${purpose} (${length} chars): ${randomString}`);
    });

    console.log();

    // 5. Encryption Validation Demo
    console.log("✅ Encryption Validation:");
    console.log("-------------------------");

    const testStrings = [
      "plaintext_password",
      await encryption.encrypt("encrypted_password"),
      "another_plain_string",
      await encryption.encrypt("another_encrypted_string"),
    ];

    console.log("🔍 Checking if strings are encrypted:");
    for (const testString of testStrings) {
      const isEncrypted = encryption.isEncrypted(testString);
      const preview =
        testString.length > 40
          ? testString.substring(0, 40) + "..."
          : testString;
      console.log(
        `   ${isEncrypted ? "🔐" : "📝"} ${preview} - ${isEncrypted ? "ENCRYPTED" : "PLAIN TEXT"}`
      );
    }

    console.log();

    // 6. Practical Test Data Example
    console.log("🧪 Practical Test Data Security:");
    console.log("--------------------------------");

    const testUsers = [
      {
        username: "admin@company.com",
        password: "AdminPassword123!",
        role: "administrator",
        apiKey: "sk_live_admin_key_xyz",
      },
      {
        username: "testuser@company.com",
        password: "TestPassword456!",
        role: "user",
        apiKey: "sk_test_user_key_abc",
      },
    ];

    console.log("🔒 Securing test user data:");
    const securedUsers = [];

    for (const user of testUsers) {
      const securedUser = {
        username: user.username, // Keep username readable
        password: await encryption.encrypt(user.password),
        role: user.role, // Keep role readable
        apiKey: await encryption.encrypt(user.apiKey),
        passwordHash: encryption.hash(user.password), // For verification
      };

      securedUsers.push(securedUser);

      console.log(`   ✅ Secured user: ${user.username}`);
      console.log(
        `      Password: ${encryption.maskSensitiveData(user.password)} → Encrypted`
      );
      console.log(
        `      API Key:  ${encryption.maskSensitiveData(user.apiKey)} → Encrypted`
      );
      console.log(
        `      Hash:     ${securedUser.passwordHash.substring(0, 16)}...`
      );
      console.log();
    }

    // 7. Usage in Tests Example
    console.log("🎯 Test Usage Example:");
    console.log("----------------------");

    console.log("📝 How to use in your Playwright tests:");
    console.log(`
// In your test step definitions:
const encryption = new DataEncryption();

// ✅ Load encrypted test data
const userData = await loadTestData('secure-users.csv');

// ✅ Decrypt for test use
const password = await encryption.decrypt(userData.encryptedPassword);

// ✅ Use in test (sensitive data never appears in logs)
await loginPage.login(userData.username, password);

// ✅ Log safely
console.log(\`Testing login for: \${encryption.maskSensitiveData(userData.username)}\`);
    `);

    // Summary
    console.log("📊 Security Features Summary:");
    console.log("-----------------------------");
    console.log("✅ AES-256 Compatible Encryption");
    console.log("✅ Secure Decryption with Key Validation");
    console.log("✅ SHA-256 Hash Generation");
    console.log("✅ Smart Data Masking for Logs");
    console.log("✅ Cryptographically Secure Random Strings");
    console.log("✅ Encryption Detection/Validation");
    console.log("✅ Environment-based Key Management");
    console.log("✅ Test Data Protection");

    console.log("\n🎉 Data Encryption Demo Completed Successfully!");
    console.log("🔐 Your sensitive test data is now secure!");
  } catch (error: any) {
    console.error("❌ Encryption demo failed:", error?.message || error);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  demonstrateEncryptionCapabilities().catch(console.error);
}
