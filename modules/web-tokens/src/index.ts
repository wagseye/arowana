"use strict";

import { getSecretByName } from "aws-info";
import jwt from "jsonwebtoken";

export async function createWebToken(
  payload: object,
  secondsToLive: number = 120
): Promise<string | undefined> {
  console.log("Creating web token");
  const key = await getSecret();
  const token = jwt.sign(payload, key, {
    expiresIn: `${secondsToLive.toString()}s`,
  });
  return token;
}

export async function verifyWebToken(token: string): Promise<void> {
  const key = await getSecret();
  jwt.verify(token, key, (err, decoded) => {
    if (err) {
      throw "Invalid web token";
    }
  });
}

async function getSecret(): Promise<string> {
  const secret = (await getSecretByName("web-token-secret")) as string;
  return secret?.["key"];
}
