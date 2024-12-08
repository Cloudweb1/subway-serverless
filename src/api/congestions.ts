import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getStationCongestionInfo } from '../database/congestions';
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
    const stationName = event.pathParameters?.stationName;
    if (!stationName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ detail: 'stationName 은 필수입니다' }),
      };
    }

    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dateType = day === 0 ? 'holidays' : day === 6 ? 'saturday' : 'weekdays';

    const result = await getStationCongestionInfo(
      stationName,
      dateType,
      `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
};
