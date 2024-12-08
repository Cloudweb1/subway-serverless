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

// 3. execute insertion
await Promise.all([
  stationRecords.map(async record => {
    try {
      const { id, name, lineNumber, latitude, longitude } = record;
      await station.create({
        data: {
          id: parseInt(id),
          name,
          line_number: lineNumber,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      });
    } catch (error) {
      console.error(error);
    }
  }),
  congestionRecords.map(async (record: CongestionRecord) => {
    try {
      const { id, dateType, lineNumber, stationId, name, direction } = record;
      const congestions = [];
      for (const key in record) {
        if (Object.prototype.hasOwnProperty.call(record, key)) {
          const element = record[key];
          if (!['id', 'dateType', 'lineNumber', 'stationId', 'name', 'direction'].includes(key)) {
            //key: 시간, value: 복잡도
            congestions.push({ time: key, degree: parseFloat(element) });
          }
        }
      }
      await congestion.create({
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
    } catch (error) {
      console.error(error);
    }
  }),
]);
