import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';
import serializeArrivalList, { SerializedArrival, SWOpenApiArrival } from '../utils/openapi/serializer';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}
const { station } = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

interface SWOpenApiErrorMessage {
  status: number;
  code: string;
  message: string;
  link: string;
  developerMessage: string;
  total: number;
}

interface SWOpenApiResponse {
  errorMessage: SWOpenApiErrorMessage;
  realtimeArrivalList?: SWOpenApiArrival[];
}

export async function getArrivalInfo(stationName: string, time: string) {
  const stations = await station.findMany();

  const apikey = process.env.API_KEY ? process.env.API_KEY : 'sample'; // 환경변수든 뭐든 openapi key
  const apiResults = [];
  let pageStart = 0;
  let pageEnd = pageStart + 5;

  while (true) {
    const url = `http://swopenapi.seoul.go.kr/api/subway/${apikey}/json/realtimeStationArrival/${pageStart}/${pageEnd}/${stationName}`;
    const { errorMessage, realtimeArrivalList }: SWOpenApiResponse = (await axios.get(url)).data;

    if (!realtimeArrivalList) {
      return [];
    }

    const serializedArrivalList = realtimeArrivalList
      .map(arrival => serializeArrivalList(arrival, time, stations))
      .filter(serialized => serialized !== undefined);
    apiResults.push(...serializedArrivalList);

    const count = errorMessage.total;
    if (pageEnd > count) {
      break;
    }

    pageStart = pageEnd + 1;
    pageEnd = pageStart + 5;
  }

  const result = new Set(apiResults.map(element => JSON.stringify(element)));
  const duplicateRemovedApiResults = Array.from(result).map(element => JSON.parse(element) as SerializedArrival);
  return duplicateRemovedApiResults;
}
