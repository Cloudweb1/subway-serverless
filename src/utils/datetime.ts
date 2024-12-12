import { DateTime } from 'luxon';

type DateType = 'weekdays' | 'saturday' | 'holidays';

export default function getDateTimeInfo() {
  const datetime = DateTime.now().setLocale('en-US').setZone('Asia/Seoul');
  const dateType: DateType = datetime.weekday === 7 ? 'holidays' : datetime.weekday === 6 ? 'saturday' : 'weekdays';
  const dateTimeInfo = {
    dateType,
    time: datetime.toFormat('HH:mm'),
  };

  return dateTimeInfo;
}
