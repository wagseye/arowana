"use strict";

import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export async function getEC2IpAddressByName(
  name: string
): Promise<string | undefined> {
  const input = {
    Filters: [
      {
        Name: "tag:Name",
        Values: ["data-access-ec2"],
      },
    ],
  };

  const command = new DescribeInstancesCommand(input);
  const client = new EC2Client({});
  const response = await client.send(command);

  if (response?.$metadata?.httpStatusCode === 200) {
    return response.Reservations?.[0]?.Instances?.[0]?.PublicIpAddress;
  }
  return undefined;
}

export async function getSecretByName(
  name: string
): Promise<{ [key: string]: string } | string | undefined> {
  const client = new SecretsManagerClient();
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: name,
    })
  );
  if (!response) throw "Error communicating with Secrets Manager";
  let value = response.SecretString;
  if (!value && response.SecretBinary) throw "Binary secrets are not supported";

  try {
    return JSON.parse(value);
  } catch (err) {}
  return value;
}
