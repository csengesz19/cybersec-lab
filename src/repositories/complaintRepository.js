import { sql, getRequest } from '../db.js';

function mapComplaintSummaryRecord(record) {
  if (!record) {
    return null;
  }

  return {
    routeId: record.JaratID,
    sourceServer: record.ForrasSzerver,
    destinationServer: record.CelSzerver,
    dayOfWeek: record.Nap,
    departureTime: record.Ora,
    complaintCount: record.PanaszDb,
    lastComplaintAt: record.UtolsoPanasz,
  };
}

function mapComplaintRecord(record) {
  if (!record) {
    return null;
  }

  return {
    complaintId: record.PanaszID,
    createdAt: record.Datum,
    routeId: record.JaratID,
    sourceServer: record.ForrasSzerver,
    destinationServer: record.CelSzerver,
    dayOfWeek: record.Nap,
    departureTime: record.Ora,
    userId: record.FelhasznaloID,
    userName: record.Nev,
    userEmail: record.Email,
  };
}

export async function createComplaint({ routeId, userId }) {
  const request = await getRequest();

  await request.input('routeId', sql.Int, routeId).input('userId', sql.Int, userId).query(`
      INSERT INTO dbo.Panasz (JaratID, FelhasznaloID)
      VALUES (@routeId, @userId);
    `);
}

export async function getComplaintSummary() {
  const request = await getRequest();
  const result = await request.query(`
    SELECT
      j.JaratID,
      j.ForrasSzerver,
      j.CelSzerver,
      j.Nap,
      j.Ora,
      COUNT(p.PanaszID) AS PanaszDb,
      MAX(p.Datum) AS UtolsoPanasz
    FROM dbo.Panasz p
    INNER JOIN dbo.Jarat j ON j.JaratID = p.JaratID
    GROUP BY j.JaratID, j.ForrasSzerver, j.CelSzerver, j.Nap, j.Ora
    ORDER BY PanaszDb DESC, UtolsoPanasz DESC;
  `);

  return result.recordset.map(mapComplaintSummaryRecord);
}

export async function getComplaintList() {
  const request = await getRequest();
  const result = await request.query(`
    SELECT
      p.PanaszID,
      p.Datum,
      j.JaratID,
      j.ForrasSzerver,
      j.CelSzerver,
      j.Nap,
      j.Ora,
      f.FelhasznaloID,
      f.Nev,
      f.Email
    FROM dbo.Panasz p
    INNER JOIN dbo.Jarat j ON j.JaratID = p.JaratID
    INNER JOIN dbo.Felhasznalo f ON f.FelhasznaloID = p.FelhasznaloID
    ORDER BY j.JaratID ASC, p.Datum DESC;
  `);

  return result.recordset.map(mapComplaintRecord);
}
