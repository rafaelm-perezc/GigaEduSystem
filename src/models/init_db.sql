-- 1. CONFIGURACIÓN INSTITUCIONAL
CREATE TABLE IF NOT EXISTS institucion (
    id TEXT PRIMARY KEY,
    nit TEXT,
    dane TEXT,
    nombre TEXT NOT NULL,
    ubicacion TEXT,
    rector_nombre TEXT,
    resolucion TEXT,
    url_logo TEXT,
    url_logo_departamento TEXT,
    url_firma_rector TEXT,
    coordinador_academico TEXT,
    coordinador_disciplinario TEXT,
    jornada TEXT,
    escala_minima REAL DEFAULT 1.0,
    escala_maxima REAL DEFAULT 5.0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. TIPOS DE DOCUMENTO LEGALES
CREATE TABLE IF NOT EXISTS tipos_documento (
    sigla TEXT PRIMARY KEY,
    nombre TEXT NOT NULL
);
INSERT OR IGNORE INTO tipos_documento (sigla, nombre) VALUES 
('TI', 'Tarjeta de Identidad'), ('CC', 'Cédula de Ciudadanía'), 
('RC', 'Registro Civil'), ('CE', 'Cédula de Extranjería'), 
('PEP', 'Permiso Especial de Permanencia'), ('PPT', 'Permiso de Protección Temporal');

-- 3. USUARIOS Y DOCENTES
CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    documento TEXT UNIQUE NOT NULL,
    primer_nombre TEXT NOT NULL,
    segundo_nombre TEXT DEFAULT '',
    primer_apellido TEXT NOT NULL,
    segundo_apellido TEXT DEFAULT '',
    rol TEXT NOT NULL,
    email TEXT,
    telefono TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    contacto_emergencia_nombre TEXT DEFAULT '',
    contacto_emergencia_telefono TEXT DEFAULT '',
    estado INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. ESTRUCTURA ACADÉMICA
CREATE TABLE IF NOT EXISTS areas (
    id TEXT PRIMARY KEY, 
    nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS asignaturas (
    id TEXT PRIMARY KEY, 
    id_area TEXT NOT NULL, 
    nombre TEXT NOT NULL, 
    peso_porcentual REAL NOT NULL, 
    FOREIGN KEY (id_area) REFERENCES areas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grados (
    id TEXT PRIMARY KEY, 
    nombre TEXT NOT NULL, 
    nivel TEXT NOT NULL, 
    activo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS grupos (
    id TEXT PRIMARY KEY, 
    id_grado TEXT NOT NULL, 
    id_docente_director TEXT, 
    nomenclatura TEXT NOT NULL, 
    jornada TEXT NOT NULL, 
    año_lectivo TEXT NOT NULL, 
    FOREIGN KEY (id_grado) REFERENCES grados(id), 
    FOREIGN KEY (id_docente_director) REFERENCES usuarios(id)
);

-- 5. ESTUDIANTES Y MATRÍCULAS
CREATE TABLE IF NOT EXISTS estudiantes (
    id TEXT PRIMARY KEY, 
    tipo_documento TEXT NOT NULL, 
    documento TEXT UNIQUE NOT NULL, 
    primer_nombre TEXT NOT NULL, 
    segundo_nombre TEXT DEFAULT '', 
    primer_apellido TEXT NOT NULL, 
    segundo_apellido TEXT DEFAULT '', 
    fecha_nacimiento TEXT, 
    direccion TEXT, 
    telefono TEXT, 
    email TEXT, 
    acudiente_nombre TEXT, 
    acudiente_telefono TEXT
);

CREATE TABLE IF NOT EXISTS matriculas (
    id TEXT PRIMARY KEY, 
    id_estudiante TEXT NOT NULL, 
    id_grupo TEXT NOT NULL, 
    estado TEXT DEFAULT 'Activo', 
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id) ON DELETE CASCADE, 
    FOREIGN KEY (id_grupo) REFERENCES grupos(id)
);

-- 6. ASIGNACIÓN ACADÉMICA
CREATE TABLE IF NOT EXISTS asignacion_academica (
    id TEXT PRIMARY KEY, 
    id_docente TEXT NOT NULL, 
    id_asignatura TEXT NOT NULL, 
    id_grupo TEXT NOT NULL, 
    FOREIGN KEY (id_docente) REFERENCES usuarios(id), 
    FOREIGN KEY (id_asignatura) REFERENCES asignaturas(id), 
    FOREIGN KEY (id_grupo) REFERENCES grupos(id)
);