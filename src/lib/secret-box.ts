import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const FORMAT_VERSION = "v1";

function getEncryptionKey() {
  const authSecret = process.env.AUTH_SECRET;

  if (!authSecret) {
    throw new Error("AUTH_SECRET não foi configurada no servidor.");
  }

  return createHash("sha256").update(authSecret, "utf8").digest();
}

export function encryptServerSecret(value: string) {
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), initializationVector);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authenticationTag = cipher.getAuthTag();

  return [
    FORMAT_VERSION,
    initializationVector.toString("base64url"),
    authenticationTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptServerSecret(value: string) {
  const [version, initializationVector, authenticationTag, encrypted] = value.split(":");

  if (
    version !== FORMAT_VERSION
    || !initializationVector
    || !authenticationTag
    || !encrypted
  ) {
    throw new Error("Formato de credencial criptografada inválido.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(initializationVector, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authenticationTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
