import { sql, getRequest } from '../db.js';

function mapTrainRouteRecord(record) {
  if (!record) {
    return null;
  }

  return {
    trainRouteId: record.JaratID,
    sourceServer: record.ForrasSzerver,
    destinationServer: record.CelSzerver,
    dayOfWeek: record.Nap,
    departureTime: record.Ora,
    cost: record.Koltseg,
    trainType: record.VonatTipus,
  };
}

export async function listTrainRoutes({ sourceServer, destinationServer, minCost, maxCost }) {
  const request = await getRequest();

  let query = `
    SELECT
      JaratID,
      ForrasSzerver,
      CelSzerver,
      Nap,
      Ora,
      Koltseg,
      VonatTipus
    FROM dbo.Jarat
    WHERE 1 = 1
  `;

  if (sourceServer) {
    query += ' AND ForrasSzerver LIKE @sourceServer';
    request.input('sourceServer', sql.NVarChar, `%${sourceServer}%`);
  }

  if (destinationServer) {
    query += ' AND CelSzerver LIKE @destinationServer';
    request.input('destinationServer', sql.NVarChar, `%${destinationServer}%`);
  }

  if (Number.isInteger(minCost)) {
    query += ' AND Koltseg >= @minCost';
    request.input('minCost', sql.Int, minCost);
  }

  if (Number.isInteger(maxCost)) {
    query += ' AND Koltseg <= @maxCost';
    request.input('maxCost', sql.Int, maxCost);
  }

  query += ' ORDER BY JaratID';

  const result = await request.query(query);
  return result.recordset.map(mapTrainRouteRecord);
}

export async function getTrainRouteById(trainRouteId) {
  const request = await getRequest();
  const result = await request.input('trainRouteId', sql.Int, trainRouteId).query(`
    SELECT
      JaratID,
      VonatTipus,
      Koltseg,
      Nap,
      Ora,
      ForrasSzerver,
      CelSzerver
    FROM dbo.Jarat
    WHERE JaratID = @trainRouteId;
  `);

  return mapTrainRouteRecord(result.recordset[0] || null);
}

export async function createTrainRoute({ sourceServer, destinationServer, dayOfWeek, departureTime, cost, trainType }) {
  const request = await getRequest();
  const normalizedDay = String(dayOfWeek).toLowerCase();

  await request
    .input('sourceServer', sql.NVarChar, sourceServer.trim())
    .input('destinationServer', sql.NVarChar, destinationServer.trim())
    .input('dayOfWeek', sql.NVarChar, normalizedDay)
    .input('departureTime', sql.VarChar, departureTime.trim())
    .input('cost', sql.Int, cost)
    .input('trainType', sql.NVarChar, trainType.trim()).query(`
      INSERT INTO dbo.Jarat (ForrasSzerver, CelSzerver, Nap, Ora, Koltseg, VonatTipus)
      VALUES (@sourceServer, @destinationServer, @dayOfWeek, @departureTime, @cost, @trainType);
    `);
}
