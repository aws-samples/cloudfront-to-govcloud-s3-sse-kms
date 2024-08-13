import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Bucket} from "aws-cdk-lib/aws-s3";
import {BucketDeployment, Source} from "aws-cdk-lib/aws-s3-deployment";
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import fs = require('fs');
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib';

export class Account1GovcloudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a KMS key for encryption
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for S3 bucket encryption',
    });
    // Adding a bucket to store files that can be signed and accessed via a CloudFront distribution
    const bucket = new Bucket(this, 'Bucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, 
      enforceSSL: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
    });

    // Adding in the assets to the bucket we want end users to have access to via signed urls
    new BucketDeployment(this, 'BucketDeployment', {
      destinationBucket: bucket,
      sources: [
        Source.asset('assets')
      ],
      retainOnDelete: false,
    });

    // Create an IAM role for the Lambda function
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    // Grant the Lambda role permission to read from the S3 bucket
    bucket.grantRead(lambdaRole);
    // Grant the Lambda role permission to use the KMS key
    encryptionKey.grantDecrypt(lambdaRole);

    // Create a Lambda function
    const lambdaFunction = new lambda.Function(this, 'PresignedUrlFunction', {
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset('lambda'), // Replace with the path to your Lambda function code
      handler: 'presigned.lambda_handler',
      logRetention: RetentionDays.THREE_DAYS,
      timeout: cdk.Duration.seconds(10),
      role: lambdaRole, // Assign the role to the Lambda function
      environment: {
        BUCKET: bucket.bucketName,
      },
    });

    // Create an API Gateway REST API
    const api = new apigw.RestApi(this, 'PresignedUrlApi', {
      description: 'API for generating presigned S3 URLs',
    });

    // Create a resource and method for the 'presigned' route
    const presignedResource = api.root.addResource('presigned');
    const presignedMethod = presignedResource.addMethod(
      'GET',
      new apigw.LambdaIntegration(lambdaFunction)
    );

    // Output the API Gateway URL for the 'presigned' route
    new cdk.CfnOutput(this, 'PresignedApiUrl', {
      value: `${api.url.endsWith('/') ? api.url.slice(0, -1) : api.url}${presignedResource.path}`,
      description: 'API Gateway URL for the "presigned" route',
    });

    // Output the bucket name created by this stack
    new cdk.CfnOutput(this, 'BucketName', {
      value: `${bucket.bucketName}`,
      description: 'The bucket name created',
    });

    // Output the bucket region
    new cdk.CfnOutput(this, 'BucketRegion', {
      value: Stack.of(this).region,
      description: 'The AWS region where the S3 bucket was created'
    });

      // Output the bucket region
      new cdk.CfnOutput(this, 'ExportHelper', {
        value: '\nexport CDK_S3_BUCKET_NAME=' + `${bucket.bucketName}` + '\nexport CDK_S3_BUCKET_REGION=' + Stack.of(this).region + '\nexport CDK_PRESIGNED_URL=' + `${api.url.endsWith('/') ? api.url.slice(0, -1) : api.url}${presignedResource.path}`,
        description: 'Export helper commands'
      });
  }
}
