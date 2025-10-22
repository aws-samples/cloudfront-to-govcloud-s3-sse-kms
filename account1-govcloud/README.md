# Account 1 - GovCloud Infrastructure

This directory contains the CDK infrastructure for the GovCloud account, which hosts the SSE-KMS encrypted S3 bucket and presigned URL generation services.

## Components

### S3 Bucket
- **Encryption**: SSE-KMS with customer-managed key
- **Access**: Restricted to Lambda execution role
- **Purpose**: Secure storage for files to be distributed via CloudFront

### Lambda Function (`presigned.py`)
- **Runtime**: Python 3.9
- **Purpose**: Generates presigned URLs for S3 objects
- **Key Features**:
  - Removes leading slash from URI paths
  - Configurable expiration (default: 1 hour)
  - Comprehensive error handling and logging
  - S3v4 signature support for SSE-KMS

### API Gateway
- **Type**: REST API
- **Purpose**: HTTP endpoint for presigned URL requests
- **Integration**: Lambda proxy integration
- **CORS**: Configured for cross-origin requests from CloudFront

### IAM Roles and Policies
- **Lambda Execution Role**: S3 and KMS permissions
- **S3 Bucket Policy**: Restricts access to Lambda function
- **KMS Key Policy**: Allows Lambda to decrypt/encrypt objects

## Environment Variables

The Lambda function uses these environment variables:
- `BUCKET`: S3 bucket name (set by CDK)
- `AWS_REGION`: GovCloud region (automatically set)

## Deployment Outputs

After successful deployment, note these outputs for Account 2 setup:
- `PresignedUrlApiUrl`: API Gateway endpoint URL
- `BucketName`: S3 bucket name for file uploads
- `BucketRegion`: AWS region where resources are deployed

## Local Development

### Prerequisites
- AWS CDK 2.151.0+
- Node.js 18.x+
- AWS CLI configured for GovCloud account

### Commands
```bash
npm ci                 # Install dependencies
npm run build         # Compile TypeScript
npm run test          # Run unit tests
cdk synth            # Generate CloudFormation template
cdk deploy           # Deploy to AWS
cdk destroy          # Clean up resources
```

## Testing

### Upload Test Files
```bash
# Upload a test file to the S3 bucket
aws s3 cp test.txt s3://<BucketName>/test.txt

# Test the API Gateway endpoint directly
curl "<PresignedUrlApiUrl>?uri=/test.txt"
```

### Verify Encryption
```bash
# Check object encryption status
aws s3api head-object --bucket <BucketName> --key test.txt
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
