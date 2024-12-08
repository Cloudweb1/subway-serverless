import geolib from 'geolib';
import { PrismaClient } from '@prisma/client';

export async function getStationsWithinLocation(latitude: number, longitude: number) {
  const { station } = new PrismaClient();
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
    const distance = geolib.getDistance(
      { latitude, longitude },
      { latitude: result.latitude, longitude: result.longitude },
    );
    return distance / 1000 <= 1;
  });

  return stationsWithinLocation;
}
