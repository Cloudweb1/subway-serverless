import { Station } from '@prisma/client';

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

export interface SWOpenApiArrival {
  subwayId: string;
  updnLine: string;
  trainLineNm: string;
  statnFid: string;
  statnTid: string;
  statnId: string;
  statnNm: string;
  trnsitCo: string;
  ordkey: string;
  subwayList: string;
  statnList: string;
  btrainSttus: string;
  barvlDt: string;
  btrainNo: string;
  bstatnId: string;
  bstatnNm: string;
  recptnDt: string;
  arvlMsg2: string;
  arvlMsg3: string;
  arvlCd: string;
  lstcarAt: string;
}

export interface SerializedArrival {
  name: string;
  lineNumber: number;
  direction: string;
  prevStation: string;
  nextStation: string;
  arriveTime: string;
}

export default function serializeArrivalList(arrival: SWOpenApiArrival, time: string, stations: Station[]) {
  const [hh, mm] = time.split(':');
  const arriveTimeMins = Math.floor(parseInt(arrival.barvlDt) / 60);

  const lineNumber = lineNumberDelta[parseInt(arrival.subwayId)];
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

    const serializedArrival: SerializedArrival = {
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

    return serializedArrival;
  }
}
