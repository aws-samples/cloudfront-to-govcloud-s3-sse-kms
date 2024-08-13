import json
import boto3
import logging
import os
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def remove_initial_slash(string):
    if string.startswith('/'):
        return string[1:]
    else:
        return string

def lambda_handler(event, context):
    try:
        logger.info(f'Received event: {json.dumps(event)}')
        # Get the bucket name and object key from the API Gateway event
        bucket_name = os.environ['BUCKET']
        object_key = remove_initial_slash(event['queryStringParameters']['uri'])
        # Generate the pre-signed URL
        s3 = boto3.client('s3', endpoint_url=f"https://s3.{os.environ.get('AWS_REGION')}.amazonaws.com", config=boto3.session.Config(signature_version='s3v4', s3={'addressing_style': 'virtual'}))

        url = s3.generate_presigned_url(
            ClientMethod='get_object',
            Params={
                'Bucket': bucket_name,
                'Key': object_key
            },
            ExpiresIn=3600  # URL expires in 1 hour
        )
        logger.info(f'url: {url}')
        # Return the pre-signed URL in the response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'presigned_url': url})
        }
    except ClientError as e:
        # Return an error message if there was an issue generating the URL
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }