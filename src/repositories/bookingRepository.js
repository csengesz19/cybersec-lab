import { sql, getRequest } from '../db.js';

function mapBookingRecord(record) {
  if (!record) {
    return null;
  }

  return {
    bookingId: record.FoglalasID,
    packetLabel: record.PacketLabel,
    packetCount: record.PacketDarab,
    createdAt: record.Letrehozva,
    userId: record.FelhasznaloID,
    userName: record.Nev,
    userEmail: record.Email,
  };
}

export async function getBookingsByRouteId(routeId) {
  const request = await getRequest();
  const result = await request.input('routeId', sql.Int, routeId).query(`
    SELECT
      F.FoglalasID,
      F.PacketLabel,
      F.PacketDarab,
      F.Letrehozva,
      U.FelhasznaloID,
      U.Nev,
      U.Email
    FROM dbo.Foglalas AS F
    INNER JOIN dbo.Felhasznalo AS U
      ON F.FelhasznaloID = U.FelhasznaloID
    WHERE F.JaratID = @routeId
    ORDER BY F.FoglalasID;
  `);

  return result.recordset.map(mapBookingRecord);
}

export async function deleteBooking(routeId, bookingId) {
  const request = await getRequest();
  const result = await request.input('routeId', sql.Int, routeId).input('bookingId', sql.Int, bookingId).query(`
    DELETE FROM dbo.Foglalas
    OUTPUT deleted.FoglalasID
    WHERE FoglalasID = @bookingId AND JaratID = @routeId;
  `);

  return result.recordset[0]?.FoglalasID ?? null;
}

export async function createBooking({ routeId, userId, packetLabel, packetCount }) {
  const request = await getRequest();
  await request
    .input('routeId', sql.Int, routeId)
    .input('userId', sql.Int, userId)
    .input('packetLabel', sql.NVarChar, packetLabel)
    .input('packetCount', sql.Int, packetCount).query(`
      INSERT INTO dbo.Foglalas (JaratID, FelhasznaloID, PacketLabel, PacketDarab)
      VALUES (@routeId, @userId, @packetLabel, @packetCount);
    `);
}

export async function getBookingOwnerId(routeId, bookingId) {
  const request = await getRequest();
  const result = await request.input('routeId', sql.Int, routeId).input('bookingId', sql.Int, bookingId).query(`
    SELECT FelhasznaloID
    FROM dbo.Foglalas
    WHERE FoglalasID = @bookingId AND JaratID = @routeId;
  `);

  return result.recordset[0]?.FelhasznaloID ?? null;
}
