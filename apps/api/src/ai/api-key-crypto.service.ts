import { Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

@Injectable()
export class ApiKeyCryptoService {
  encrypt(value: string) {
    if (!value) return "";

    const key = this.getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64")}`;
  }

  decrypt(value: string) {
    if (!value) return "";
    if (!value.startsWith(PREFIX)) return value;

    const key = this.getKey();
    const payload = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  }

  mask(value: string) {
    const decrypted = this.decrypt(value);
    return decrypted ? `***${decrypted.slice(-4)}` : "";
  }

  private getKey() {
    const secret = process.env.MODEL_KEY_ENCRYPTION_SECRET;
    if (!secret) {
      throw new Error("MODEL_KEY_ENCRYPTION_SECRET is required to store encrypted model API keys");
    }
    return createHash("sha256").update(secret).digest();
  }
}
