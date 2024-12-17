import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getStationCongestionInfo } from '../database/congestions';
import getDateTimeInfo from '../utils/datetime';
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
    const stationId = event.pathParameters?.stationId;
    if (!stationId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ detail: 'stationId 은 필수입니다' }),
      };
    }
    const { dateType, time } = getDateTimeInfo();
    const result = await getStationCongestionInfo(decodeURIComponent(stationId), dateType, time);
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
