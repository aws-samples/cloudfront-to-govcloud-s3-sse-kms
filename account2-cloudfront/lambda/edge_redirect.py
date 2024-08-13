import logging
import json
import boto3
import os
import urllib3
from botocore.exceptions import ClientError
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse, parse_qs

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_api_gateway_url_from_parameter_store():
    ssm = boto3.client('ssm')
    
    response = ssm.get_parameter(Name='cloudfront_api_gateway_presigned_url')
    return response['Parameter']['Value']

def call_api_gateway(api_gateway_url, params):
    try:
        # Create a PoolManager instance
        http = urllib3.PoolManager()

        # Make the API request
        response = http.request('GET', api_gateway_url, fields=params)

        # Get the response data
        data = response.data.decode('utf-8')

        # Convert the response data to JSON
        json_data = json.loads(data)

        # Return the JSON data
        return json_data.get('presigned_url')

    except urllib3.exceptions.RequestError as e:
        logger.error(f"Error calling api gateway for presigned url: {e}")
        raise e

def parse_query_params(url):
    parsed_url = urlparse(url)
    query_params = parse_qs(parsed_url.query)
    return query_params

def lambda_handler(event, context):
    logger.info(f'Received event: {json.dumps(event)}')
    
    try:
        """
        Generate HTTP redirect response with 302 status code and Location header.
        """
        request = event['Records'][0]['cf']['request']
        uri = request['uri']
        querystring = request['querystring']
        # check if the query string contains this X-Amz-Credential parameter indicating it is already a presigned url 
        if 'X-Amz-Credential' in querystring:
            return request
        else:
            presigned_api_gateway_uri = get_api_gateway_url_from_parameter_store()
            presigned_url = call_api_gateway(presigned_api_gateway_uri, {"uri": uri})

            query_start = presigned_url.find('?')
            query_params = presigned_url[query_start + 1:]
            location = uri + '?' + query_params
            response = {
                "status": "302",
                "statusDescription": "Found",
                "headers": {
                    "location": [
                        {
                            "value": location,
                            "key": "Location"
                        }
                    ]
                }
            }
            return response
    except ClientError as e:
        # Return an error message if there was an issue generating the URL
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }