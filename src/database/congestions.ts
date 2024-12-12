import { PrismaClient } from '@prisma/client';

import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}
const { congestion } = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

type DateType = 'weekdays' | 'saturday' | 'holidays';
type DirectionType = '1' | '2';
interface RawCongestionQueryResult {
  _id: { $oid: string };
  id: number;
  date_type: DateType;
  line_number: string;
  station_id: string;
  station_name: string;
  direction: DirectionType;
  congestions: {
    time: string;
    degree: number;
  }[];
}

export async function getStationCongestionInfo(stationName: string, dateType: DateType, time: string) {
  // 시간 필터 만들기
  const [hh, mm] = time.split(':');
  const adjustedTime = `${hh}:${parseInt(mm) >= 30 ? '30' : '00'}`;

  const rawQueryResult = await congestion.findRaw({
    filter: { station_name: stationName, date_type: dateType },
    options: {
      sort: { line_number: 1, direction: 1 },
      projection: {
        station_name: 1,
        date_type: 1,
        line_number: 1,
        station_id: 1,
        _id: 0,
        id: 1,
        direction: 1,
        congestions: {
          $filter: {
            input: '$congestions',
            as: 'congestion',
            cond: {
              $and: [
                {
                  $eq: ['$$congestion.time', adjustedTime],
                },
                {
                  $ne: ['$$congestion.degree', 0],
                },
              ],
            },
          },
        },
      },
    },
  });

  // [n호선 상행, n호선 하행, m호선 상행, m호선 하행, ... ]
  const results = JSON.parse(JSON.stringify(rawQueryResult)) as RawCongestionQueryResult[];
  const iterCount = results.length;
  const aggregatedResults = [];

  for (let index = 0; index < iterCount; index += 2) {
    aggregatedResults.push({
      lineNumber: results[index].line_number,
      upDegree: results[index].congestions[0]
        ? results[index].congestions[0]
        : '해당 시간에 열차가 운행하지 않아 혼잡도가 존재하지 않습니다',
      downDegree: results[index + 1].congestions[0]
        ? results[index + 1].congestions[0]
        : '해당 시간에 열차가 운행하지 않아 혼잡도가 존재하지 않습니다',
    });
  }

  return aggregatedResults;
}
