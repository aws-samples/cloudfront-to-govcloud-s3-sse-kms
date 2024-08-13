#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Account1GovcloudStack } from '../lib/account1-govcloud-stack';

const app = new cdk.App();
new Account1GovcloudStack(app, 'Account1GovCloudS3PresignedAPIGatewayStack', {});