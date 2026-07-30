import { blink } from '@/lib/blink';

export const createPriceReport = async (stationId: string, fuelType: string, reportedPrice: number, userId?: string) => {
  return await blink.db.priceReports.create({
    id: `rpt_${Math.random().toString(36).substr(2, 9)}`,
    station_id: stationId,
    fuel_type: fuelType,
    reported_price: reportedPrice,
    user_id: userId || null,
  });
};
