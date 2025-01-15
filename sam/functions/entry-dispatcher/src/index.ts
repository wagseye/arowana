"use strict";

import { getEC2IpAddressByName } from "aws-info";
import { createWebToken } from "web-tokens";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { InvokeCommand, LambdaClient, LogType } from "@aws-sdk/client-lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  let ipAddr;
  let webToken;
  try {
    const orgId = getOrganizationId(event);
    const projectId = getProjectId(event, orgId);
    const routingInfo = getRoutingInfo(event, orgId, projectId);
    const response = await forwardRequest(event, routingInfo);
    return response;
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: undefined,
    };
  }
};

function getOrganizationId(req: APIGatewayProxyEvent): string {
  return "001abcdefghijkl";
}

function getProjectId(
  req: APIGatewayProxyEvent,
  organizationId: string
): string {
  return "";
}

class RoutingInfo {
  public controllerName: string;
  public methodName: string;
  constructor(controllerName: string, methodName: string = "handleRequest") {
    this.controllerName = controllerName;
    this.methodName = methodName;
  }
}

function getRoutingInfo(
  req: APIGatewayProxyEvent,
  organiztionId: string,
  projectId: string
): RoutingInfo {
  return new RoutingInfo("MyFirstController");
}

async function forwardRequest(
  event: APIGatewayProxyEvent,
  routingInfo: RoutingInfo
): Promise<APIGatewayProxyResult | undefined> {
  const client = new LambdaClient({});
  const dbAddress = await getEC2IpAddressByName("data-access-ec2");
  const dbToken = await createWebToken({ foo: "bar" });
  console.log(`IP address: ${dbAddress}, token: ${dbToken}`);
  const command = new InvokeCommand({
    FunctionName: "TestLambda",
    Payload: JSON.stringify({ database: { ip: dbAddress, token: dbToken } }),
    LogType: LogType.Tail,
  });

  const { Payload, LogResult } = await client.send(command);
  const result = Buffer.from(Payload).toString();
  const logs = Buffer.from(LogResult, "base64").toString();
  console.log(`Remote lambda invocation result: ${JSON.stringify(result)}`);
  console.log(`Remote lambda invocation logs: ${logs}`);
  return undefined;
}
