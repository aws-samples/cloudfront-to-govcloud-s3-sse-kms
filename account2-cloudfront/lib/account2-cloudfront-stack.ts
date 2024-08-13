import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface Account2CloudfrontProps extends cdk.StackProps {
  bucketName: string;
  s3region: string;
  presignedUrl: string;
}

export class Account2CloudfrontStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Account2CloudfrontProps) {
    super(scope, id, props);
    
    // Check if any of the values are null or empty
    const isNullOrEmpty = (value: string) => value === null || value === '';

    if (isNullOrEmpty(props.bucketName) || isNullOrEmpty(props.s3region) || isNullOrEmpty(props.presignedUrl)) {
      throw new Error('One or more of the required properties (bucketName, s3region, presignedUrl) are null or empty.');
    }

    // Parameter Name must be hard code due to the use of Lambda@Edge which cannot use environment variables
    const presignedUrlParameter = new ssm.StringParameter(this, 'PresignedUrlParameter', {
      parameterName: 'cloudfront_api_gateway_presigned_url',
      stringValue: props.presignedUrl,
    });

    const cachePolicyProps: cloudfront.CachePolicyProps = {
      maxTtl: cdk.Duration.seconds(36000),
      defaultTtl: cdk.Duration.seconds(3600),
      minTtl: cdk.Duration.seconds(0),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    };

    const cachePolicy = new cloudfront.CachePolicy(this, 'S3-Presigned-CachePolicy', cachePolicyProps);

    const s3OriginSource = new origins.HttpOrigin(`${props.bucketName}.s3.${props.s3region}.amazonaws.com`, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY
    });

    const lambdaFunction = new lambda.Function(this, 'LambdaFunction', {
      code: lambda.Code.fromAsset('lambda'),
      handler: 'edge_redirect.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_12,
      logRetention: RetentionDays.THREE_DAYS,
      timeout: cdk.Duration.seconds(10),
    });
    presignedUrlParameter.grantRead(lambdaFunction);

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: s3OriginSource,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy,
        edgeLambdas: [
          {
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
            functionVersion: lambdaFunction.currentVersion,
            includeBody: false,
          },
        ],
      },
      defaultRootObject: 'index.html',
      enableIpv6: true,
      httpVersion: cloudfront.HttpVersion.HTTP2,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Output the Demo URL to the index.html file stored on the second account S3
    new cdk.CfnOutput(this, 'DemoRedirectUrl', {
      value: `https://${distribution.distributionDomainName}/helloworld.html`,
      description: 'Demo redirect to presigned URL',
    });
  }
}