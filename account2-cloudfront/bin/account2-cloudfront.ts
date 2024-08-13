#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Account2CloudfrontStack, Account2CloudfrontProps } from '../lib/account2-cloudfront-stack';

const app = new cdk.App();

const stackProps: Account2CloudfrontProps = {
  bucketName: process.env.CDK_S3_BUCKET_NAME || '',
  s3region: process.env.CDK_S3_BUCKET_REGION || '',
  presignedUrl: process.env.CDK_PRESIGNED_URL || '',
  env: {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION
  }
};

new Account2CloudfrontStack(app, 'Account2CloudFrontLambdaAtEdgeRedirectExternalS3Stack', stackProps);