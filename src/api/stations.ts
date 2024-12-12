import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getStationsWithinLocation } from '../database/stations';
/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const latitude = event.queryStringParameters?.latitude;
    const longitude = event.queryStringParameters?.longitude;
    if (!latitude || !longitude) {
      return {
        statusCode: 400,
        body: JSON.stringify({ detail: 'latitude 와 longitude 는 필수입니다' }),
      };
    }

    const result = await getStationsWithinLocation(parseFloat(latitude), parseFloat(longitude));
    return {
      statusCode: 200,
      body: JSON.stringify(result),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
};
