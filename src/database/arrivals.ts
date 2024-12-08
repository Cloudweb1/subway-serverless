import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';

// 공공데이터 상의 지하철 역 번호와 실제 지하철 역 번호가 달라서 해당 차이를 기록함_개고생함 ㄹㅇ
interface Delta {
  [key: number]: number;
}

export const stationDelta: Delta = {
  1: 0,
  2: 0,
  3: 10,
  4: 0,
  5: -1,
  6: -2,
  7: -2,
  8: -1,
};

// 경의중앙선, 수인분당선, 공항철도 등의 데이터를 무시하기 위함
export const lineNumberDelta: Delta = {
  1001: 1,
  1002: 2,
  1003: 3,
  1004: 4,
  1005: 5,
  1006: 6,
  1007: 7,
  1008: 8,
};

export async function getArrivalInfo(stationName: string, time: string) {
  const { station } = new PrismaClient();
  const stations = await station.findMany();

  if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
  }

  const apikey = process.env.API_KEY; // 환경변수든 뭐든 openapi key
  const apiResults = [];
  let pageStart = 0;
  let pageEnd = pageStart + 5;

  while (true) {
    const url = `http://swopenapi.seoul.go.kr/api/subway/${apikey}/json/realtimeStationArrival/${pageStart}/${pageEnd}/${stationName}`;
    const data = (await axios.get(url)).data;

    if (Object.keys(data).includes('realtimeArrivalList')) {
      const { errorMessage, realtimeArrivalList } = data;
      apiResults.push(
        ...realtimeArrivalList.map((arrival: any) => {
          const [hh, mm] = time.split(':');
          const arriveTimeMins = Math.floor(parseInt(arrival.barvlDt) / 60);

          const lineNumber = lineNumberDelta[arrival.subwayId];
          if (lineNumber) {
            // 이전, 다음 역명 구하기
            const prevStation = stations.find(station => {
              const stationNum = station.id + stationDelta[lineNumber];
              return stationNum.toString() === arrival.statnFid.slice(-3);
            });

            const nextStation = stations.find(station => {
              const stationNum = station.id + stationDelta[lineNumber];
              return stationNum.toString() === arrival.statnTid.slice(-3);
            });

            // 시간 구하기
            let newHour = parseInt(hh);
            let newMinute = parseInt(mm) + arriveTimeMins;
            if (newMinute >= 60) {
              newMinute -= 60;
              newHour += 1;
            }
            newHour = newHour % 24;

            return {
              name: arrival.statnNm,
              lineNumber,
              direction: arrival.updnLine === '상행' || arrival.updnLine === '내선' ? '1' : '2',
              prevStation: prevStation ? prevStation.name : '이전역 없음',
              nextStation: nextStation ? nextStation.name : '다음역 없음',
              arriveTime: `${newHour.toLocaleString('en-US', {
                minimumIntegerDigits: 2,
              })}:${newMinute.toLocaleString('en-US', {
                minimumIntegerDigits: 2,
              })}`,
            };
          }
        }),
      );

      const count = errorMessage.total;
      if (pageEnd > count) {
        break;
      }

      pageStart = pageEnd + 1;
      pageEnd = pageStart + 5;
    } else {
      return '이 역에 해당 시간대의 도착 차량은 존재하지 않습니다';
    }
  }

  const result = new Set(apiResults.filter(result => result).map(element => JSON.stringify(element)));
  return Array.from(result).map(element => JSON.parse(element));
}
