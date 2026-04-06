import { sql, getRequest } from '../db.js';

function mapUser(record) {
  if (!record) return null;

  return {
    userId: record.FelhasznaloID,
    name: record.Nev,
    email: record.Email,
    passwordHash: record.JelszoHash,
    isAdmin: record.AdminE === 1 || record.FelhasznaloID === 1,
  };
}

export async function findUserByEmail(email) {
  const request = await getRequest();
  const result = await request.input('email', sql.NVarChar, email).query(`
      SELECT *
      FROM dbo.Felhasznalo
      WHERE Email = @email;
    `);

  return mapUser(result.recordset[0]);
}

export async function createUser({ name, email, passwordHash }) {
  const request = await getRequest();

  const result = await request
    .input('name', sql.NVarChar, name)
    .input('email', sql.NVarChar, email)
    .input('passwordHash', sql.NVarChar, passwordHash)
    .query(` INSERT INTO dbo.Felhasznalo (Nev, Email, JelszoHash, AdminE)
      OUTPUT inserted.*
      VALUES (@name, @email, @passwordHash, 0);
    `);

  return mapUser(result.recordset[0]);
}

export async function findUserById(userId) {
  const request = await getRequest();

  const result = await request.input('userId', sql.Int, userId).query(`
      SELECT *
      FROM dbo.Felhasznalo
      WHERE FelhasznaloID = @userId;
    `);

  return mapUser(result.recordset[0]);
}
