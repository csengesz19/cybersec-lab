USE VonatTarsasag;
GO

CREATE TABLE dbo.Felhasznalo
(
    FelhasznaloID INT IDENTITY(1,1)
        CONSTRAINT PK_Felhasznalo PRIMARY KEY,

    Nev NVARCHAR(100) NOT NULL,

    Email NVARCHAR(100) NOT NULL
        CONSTRAINT UQ_Felhasznalo_Email UNIQUE,

    JelszoHash NVARCHAR(255) NOT NULL
);
GO

CREATE TABLE dbo.Jarat
(
    JaratID INT IDENTITY(1,1)
        CONSTRAINT PK_Jarat PRIMARY KEY,

    ForrasSzerver NVARCHAR(100) NOT NULL,
    CelSzerver NVARCHAR(100) NOT NULL,

    Nap NVARCHAR(20) NOT NULL
        CONSTRAINT CK_Jarat_Nap CHECK (
            Nap IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')
        ),

    Ora TIME(0) NOT NULL,

    Koltseg INT NOT NULL
        CONSTRAINT CK_Jarat_Koltseg_Pozitiv CHECK (Koltseg > 0),

    VonatTipus NVARCHAR(100) NOT NULL,

    Letrehozva DATETIME2 NOT NULL
        CONSTRAINT DF_Jarat_Letrehozva DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.Foglalas
(
    FoglalasID INT IDENTITY(1,1)
        CONSTRAINT PK_Foglalas PRIMARY KEY,

    JaratID INT NOT NULL,
    FelhasznaloID INT NOT NULL,

    PacketLabel NVARCHAR(150) NOT NULL,

    PacketDarab INT NOT NULL
        CONSTRAINT DF_Foglalas_PacketDarab DEFAULT 1
        CONSTRAINT CK_Foglalas_PacketDarab_Pozitiv CHECK (PacketDarab > 0),

    Letrehozva DATETIME2 NOT NULL
        CONSTRAINT DF_Foglalas_Letrehozva DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_Foglalas_Jarat
        FOREIGN KEY (JaratID)
        REFERENCES dbo.Jarat(JaratID)
        ON DELETE CASCADE,

    CONSTRAINT FK_Foglalas_Felhasznalo
        FOREIGN KEY (FelhasznaloID)
        REFERENCES dbo.Felhasznalo(FelhasznaloID)
);
GO

CREATE TABLE dbo.Panasz
(
    PanaszID INT IDENTITY(1,1)
        CONSTRAINT PK_Panasz PRIMARY KEY,

    FelhasznaloID INT NOT NULL,
    JaratID INT NOT NULL,

    Datum DATETIME2 NOT NULL
        CONSTRAINT DF_Panasz_Datum DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Panasz_Felhasznalo
        FOREIGN KEY (FelhasznaloID)
        REFERENCES dbo.Felhasznalo(FelhasznaloID),

    CONSTRAINT FK_Panasz_Jarat
        FOREIGN KEY (JaratID)
        REFERENCES dbo.Jarat(JaratID)
);
GO