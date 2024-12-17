import { PrismaClient, Station } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';
import serializeArrivalList, { SWOpenApiArrival } from '../utils/openapi/serializer';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}
const { station } = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

interface ArrivalsList {
  upbound: string[];
  downbound: string[];
}

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

export async function getArrivalInfo(stationId: number, time: string) {
  let prevStation: Station | undefined;
  let currentStation: Station;
  let nextStation: Station | undefined;

  const stations = await station.findMany({
    where: {
      id: { in: [stationId - 1, stationId, stationId + 1] },
    },
    orderBy: {
      id: 'asc',
    },
  });

  // 세개 다있는경우
  if (stations.length === 3) {
    [prevStation, currentStation, nextStation] = stations;
  } else {
    if (stationId === stations[0].id) {
      // 이전역이 없는경우 (0: 현재, 1: 다음)
      currentStation = stations[0];
      nextStation = stations[1];
    } else {
      // 다음역이 없는경우 (0: 이전, 1: 현재)
      prevStation = stations[0];
      currentStation = stations[1];
    }
  }

  const apikey = process.env.API_KEY ? process.env.API_KEY : 'sample'; // 환경변수든 뭐든 openapi key
  let apiResults: ArrivalsList = {
    upbound: [],
    downbound: [],
  };

  let pageStart = 0;
  let pageEnd = pageStart + 5;

  while (true) {
    const url = `http://swopenapi.seoul.go.kr/api/subway/${apikey}/json/realtimeStationArrival/${pageStart}/${pageEnd}/${currentStation.name}`;
    const { errorMessage, realtimeArrivalList }: SWOpenApiResponse = (await axios.get(url)).data;

    if (!realtimeArrivalList) {
      break;
    }

    realtimeArrivalList.forEach(arrival => {
      const { arriveTime, direction } = serializeArrivalList(arrival, time);
      if (direction === '상행' || direction === '내선') {
        apiResults.upbound.push(arriveTime);
      } else {
        apiResults.downbound.push(arriveTime);
      }
    });

    const count = errorMessage.total;
    if (pageEnd > count) {
      break;
    }

    pageStart = pageEnd + 1;
    pageEnd = pageStart + 5;
  }

  apiResults.upbound = [...new Set(apiResults.upbound)];
  apiResults.downbound = [...new Set(apiResults.downbound)];

  return {
    name: currentStation.name,
    lineNumber: currentStation.line_number,
    prevStation: prevStation ? prevStation.name : '이전역 없음',
    nextStation: nextStation ? nextStation.name : '다음역 없음',
    arrivals: apiResults,
  };
}
