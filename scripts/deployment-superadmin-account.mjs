// One-time provisioning explicitly requested by the project owner.
// Only a salted password digest is deployed; the plaintext password is never committed.
// This module is used by the build script, never by the browser or a public endpoint.
export const deploymentSuperadmin = Object.freeze({
  migration: 'julio-alvarez-superadmin-v1',
  email: 'julio.alvarez@fabricsoft.com.mx',
  passwordHasher: 'pbkdf2_sha256',
  passwordDigest: 'pbkdf2_sha256$600000$q5sqrOB13/FpK5gTEjxSg0F2fekNoqXJ$jKwjSRIQX3tVgBPihTXnU6fumKM8JWq+gS/Rx0t6L2g=',
});
