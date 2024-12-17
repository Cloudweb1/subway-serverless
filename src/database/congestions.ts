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

export async function getStationCongestionInfo(stationId: string, dateType: DateType, time: string) {
  // 시간 필터 만들기
  const [hh, mm] = time.split(':');
  const adjustedTime = `${hh}:${parseInt(mm) >= 30 ? '30' : '00'}`;

  const rawQueryResult = await congestion.findRaw({
    filter: { station_id: stationId, date_type: dateType },
    options: {
      sort: { direction: 1 },
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

  // [상행선, 하행선]
  const [upDegreeResult, downDegreeResult] = JSON.parse(JSON.stringify(rawQueryResult)) as RawCongestionQueryResult[];
  const upDegreeCongestions = upDegreeResult.congestions.pop();
  const downDegreeCongestions = downDegreeResult.congestions.pop();

  const result = {
    lineNumber: upDegreeResult.line_number,
    upDegree: upDegreeCongestions ? upDegreeCongestions : 0,
    downDegree: downDegreeCongestions ? downDegreeCongestions : 0,
  };

  return result;
}
