import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

interface StationRecord {
  id: string;
  name: string;
  lineNumber: string;
  latitude: string;
  longitude: string;
}

interface CongestionRecord {
  id: string;
  dateType: string;
  lineNumber: string;
  stationId: string;
  name: string;
  direction: string;
  [key: string]: string;
}

// 1. read csv file
const __dirname = import.meta.dirname;

const rawStationData = fs.readFileSync(`${__dirname}/stationLocations.csv`, 'utf-8');
const stationRecords: StationRecord[] = parse(rawStationData, {
  columns: true,
});

const rawCongestionData = fs.readFileSync(`${__dirname}/congestions.csv`, 'utf-8');
const congestionRecords: CongestionRecord[] = parse(rawCongestionData, {
  columns: true,
});

// 2. initialize prisma client
const { station, congestion } = new PrismaClient();

// 3. define insertion
async function insertStationRecords(record: StationRecord) {
  const { id, name, lineNumber, latitude, longitude } = record;
  return station.create({
    data: {
      id: parseInt(id),
      name,
      line_number: lineNumber,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    },
  });
}

async function insertCongestionRecords(record: CongestionRecord) {
  const { id, dateType, lineNumber, stationId, name, direction } = record;
  const congestions = [];
  for (const key in record) {
    if (Object.hasOwnProperty.call(record, key)) {
      const element = record[key];
      const BASIC_INFO_KEY = ['id', 'dateType', 'lineNumber', 'stationId', 'name', 'direction'];
      if (!BASIC_INFO_KEY.includes(key)) {
        //key: 시간, value: 복잡도
        congestions.push({ time: key, degree: parseFloat(element) });
      }
    }
  }
  return congestion.create({
    data: {
      id: parseInt(id),
      date_type: dateType,
      line_number: lineNumber,
      station_id: stationId,
      station_name: name,
      direction,
      congestions,
    },
  });
}

// 3. execute insertion
try {
  await Promise.all([stationRecords.map(insertStationRecords), congestionRecords.map(insertCongestionRecords)]);
} catch (error) {
  console.error(error);
}
