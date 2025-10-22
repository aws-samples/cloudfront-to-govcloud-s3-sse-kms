# Account 2 - CloudFront Distribution

This directory contains the CDK infrastructure for the commercial account, which hosts the CloudFront distribution and Lambda@Edge function for intelligent request routing.

## Components

### CloudFront Distribution
- **Purpose**: CDN for GovCloud S3 content with custom domain support
- **Origin**: Dummy origin (requests are intercepted by Lambda@Edge)
- **Behaviors**: All requests trigger Lambda@Edge origin request function
- **Caching**: Configured to work with presigned URLs

### Lambda@Edge Function (`edge_redirect.py`)
- **Runtime**: Python 3.9
- **Trigger**: CloudFront origin request
- **Purpose**: Intelligent URL redirection and presigned URL integration
- **Key Features**:
  - Detects existing presigned URLs to avoid double-processing
  - Retrieves API Gateway endpoint from Parameter Store
  - Generates HTTP 302 redirects with presigned URLs
  - Comprehensive error handling and logging

### Systems Manager Parameter Store
- **Parameter**: `cloudfront_api_gateway_presigned_url`
- **Purpose**: Stores GovCloud API Gateway endpoint
- **Benefits**: Enables dynamic configuration without code changes

### IAM Roles and Policies
- **Lambda@Edge Execution Role**: CloudWatch Logs and SSM Parameter Store access
- **Cross-region permissions**: Required for Lambda@Edge replication

## Required Environment Variables

Set these before deployment:
```bash
export CDK_PRESIGNED_URL="<API Gateway URL from Account 1>"
export CDK_S3_BUCKET_NAME="<S3 bucket name from Account 1>"
export CDK_S3_BUCKET_REGION="<GovCloud region from Account 1>"
```

## Lambda@Edge Function Details

### Request Processing Flow
1. **Event Analysis**: Extracts URI and query parameters from CloudFront event
2. **Presigned URL Detection**: Checks for `X-Amz-Credential` parameter
3. **Conditional Logic**:
   - If presigned: Pass request through unchanged
   - If not presigned: Generate presigned URL and create redirect
4. **Response Generation**: Returns appropriate response (pass-through or redirect)

### Security Considerations
- **Parameter Validation**: Validates all incoming requests
- **Error Handling**: Graceful degradation on API failures
- **Logging**: Comprehensive CloudWatch logging for debugging
- **Timeout Handling**: Manages API Gateway request timeouts

## Deployment Outputs

After successful deployment:
- `DemoRedirectUrl`: Test URL to validate end-to-end functionality
- `CloudFrontDomainName`: Distribution domain for custom domain setup
- `CloudFrontDistributionId`: Distribution ID for management operations

## Local Development

### Prerequisites
- AWS CDK 2.151.0+
- Node.js 18.x+
- AWS CLI configured for commercial account
- Account 1 deployment completed

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

### Validate Lambda@Edge Function
```bash
# Test the demo URL
curl -I "<DemoRedirectUrl>"

# Should return HTTP 302 with Location header containing presigned URL
```

### Debug Lambda@Edge
```bash
# View CloudWatch logs (note: logs appear in the region where function executed)
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/us-east-1"
```

### Custom Domain Setup
If using a custom domain:
1. Create SSL certificate in us-east-1 (required for CloudFront)
2. Update CloudFront distribution with custom domain
3. Configure DNS to point to CloudFront distribution

## Important Notes

- **Lambda@Edge Deployment**: Functions are automatically replicated to all edge locations
- **Deletion Delays**: Lambda@Edge functions take 15-30 minutes to fully delete
- **Regional Constraints**: Lambda@Edge functions must be created in us-east-1
- **Log Distribution**: Logs appear in the region where the function executed (varies by user location)

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
