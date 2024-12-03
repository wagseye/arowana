// These classes are really meant to be a placeholder for a future Settings system (module, microservice, or both).
// It is meant to encapsulate all of the logic for how to load values that can change independently from the
// code. It is also an abstraction layer to reduce noise while I figure out the best place for settings
// values to be stored.

import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { fromInstanceMetadata } from "@aws-sdk/credential-providers"; // ES6 import

export enum SettingType {
  DatabaseCredentials,
  DatabaseSecretName,
  AWSRegion,
}

enum SettingSource {
  SecretsManager,
  Local,
}

class SettingInfo {
  public source: SettingSource;
  public nativeName: string;
  public settingValue: SettingType;
  constructor(
    source: SettingSource,
    nativeName: string,
    settingValue: SettingType = undefined
  ) {
    if (!nativeName && !settingValue)
      throw new Error(
        "SettingInfo must have either a nativeName or settingValue specified"
      );
    this.source = source;
    this.nativeName = nativeName;
    this.settingValue = settingValue;
  }
}

export default class Settings {
  public static async getValue(name: SettingType): Promise<unknown> {
    const settingInfo = this.SETTINGS_VALUES[name];
    if (!settingInfo) throw new Error(`Did not find setting info for ${name}`);
    if (settingInfo.source === SettingSource.SecretsManager) {
      return await this.getValueFromSecretsManager(settingInfo);
    } else if (settingInfo.source === SettingSource.Local) {
      return await this.getValueFromLocal(settingInfo);
    }
  }

  public static async getObjectValue(
    name: SettingType
  ): Promise<object | undefined> {
    const value = await this.getValue(name);
    if (typeof value !== "object")
      throw new Error("Setting retrieved by getObjectValue is not an object");
    return value;
  }

  public static async getStringValue(
    name: SettingType
  ): Promise<string | undefined> {
    const value = await this.getValue(name);
    if (typeof value !== "string")
      throw new Error("Setting retrieved by getObjectValue is not a string");
    return value;
  }

  private static async getValueFromSecretsManager(
    settingInfo: SettingInfo
  ): Promise<unknown> {
    const nativeName = this.getNativeName(settingInfo);
    const client = new SecretsManagerClient({
      credentials: fromInstanceMetadata({
        maxRetries: 3, // Optional
        timeout: 0, // Optional
      }),
      region: await this.getStringValue(SettingType.AWSRegion),
    });
    console.log(`About to make call to Secrets Manager`);
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: nativeName,
      })
    );
    console.log(
      `Call to Secrets Manager returned object with ${
        Object.keys(JSON.parse(response.SecretString)).length
      } keys`
    );
    return JSON.parse(response.SecretString);
  }

  // TODO: This should look for environment variable overrides as well
  private static async getValueFromLocal(
    settingInfo: SettingInfo
  ): Promise<unknown> {
    const nativeName = this.getNativeName(settingInfo);
    console.log(
      `Value from local returning ${nativeName} for ${settingInfo.source}`
    );
    return nativeName;
  }

  private static getNativeName(settingInfo: SettingInfo) {
    if (!settingInfo)
      throw new Error("SettingInfo parameter must have a value");
    if (settingInfo.nativeName) {
      console.log(
        `Returning from getNativeName value: ${settingInfo.nativeName}`
      );
      return settingInfo.nativeName;
    }
    const childSettingInfo = this.SETTINGS_VALUES[settingInfo.settingValue];
    if (!childSettingInfo)
      throw new Error(`Did not find setting info for ${childSettingInfo}`);
    console.log(
      `Doing recursive call into getNativeName: ${settingInfo.source} / ${childSettingInfo.source}`
    );
    return this.getNativeName(childSettingInfo);
  }

  // TODO: SettingInfo should be an interface with difference implementing subclasses
  private static SETTINGS_VALUES = {
    [SettingType.DatabaseCredentials]: new SettingInfo(
      SettingSource.SecretsManager,
      null,
      SettingType.DatabaseSecretName
    ),
    [SettingType.DatabaseSecretName]: new SettingInfo(
      SettingSource.Local,
      "database_credentials_dev"
    ),
    [SettingType.AWSRegion]: new SettingInfo(SettingSource.Local, "us-west-2"),
  };
}
