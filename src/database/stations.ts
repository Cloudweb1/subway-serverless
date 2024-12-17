import getDistance from 'geolib/es/getDistance';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}
const { station } = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

export async function getStationsWithinLocation(latitude: number, longitude: number) {
  const results = await station.findMany({
    select: {
      id: true,
      name: true,
      line_number: true,
      latitude: true,
      longitude: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const stationsWithinLocation = results.filter(result => {
    const distance = getDistance({ latitude, longitude }, { latitude: result.latitude, longitude: result.longitude });
    return distance / 1000 <= 1;
  });

  return stationsWithinLocation;
}
