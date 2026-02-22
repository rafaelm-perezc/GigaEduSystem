-- 1. CONFIGURACIÓN INSTITUCIONAL
CREATE TABLE IF NOT EXISTS institucion (
    id TEXT PRIMARY KEY,
    nit TEXT,
    dane TEXT,
    nombre TEXT NOT NULL,
    rector_nombre TEXT,
    resolucion TEXT,
    url_logo TEXT,
    url_firma_rector TEXT,
    escala_minima REAL DEFAULT 1.0,
    escala_maxima REAL DEFAULT 5.0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. SIEE DINÁMICO (Dimensiones)
CREATE TABLE IF NOT EXISTS siee_dimensiones (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    peso_porcentual REAL NOT NULL,
    estado INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. USUARIOS (Administrativos y Docentes)
CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    documento TEXT UNIQUE NOT NULL,
    primer_nombre TEXT NOT NULL,
    segundo_nombre TEXT DEFAULT '',
    primer_apellido TEXT NOT NULL,
    segundo_apellido TEXT DEFAULT '',
    rol TEXT NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    url_firma TEXT,
    contacto_emergencia_nombre TEXT DEFAULT '',
    contacto_emergencia_telefono TEXT DEFAULT '',
    estado INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. ESTRUCTURA CURRICULAR
CREATE TABLE IF NOT EXISTS areas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    estado INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asignaturas (
    id TEXT PRIMARY KEY,
    id_area TEXT NOT NULL,
    nombre TEXT NOT NULL,
    peso_porcentual REAL NOT NULL,
    estado INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_area) REFERENCES areas(id) ON DELETE CASCADE
);

-- 5. GRADOS Y GRUPOS
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_grado) REFERENCES grados(id),
    FOREIGN KEY (id_docente_director) REFERENCES usuarios(id)
);

-- 6. ESTUDIANTES Y MATRÍCULAS
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
    acudiente_telefono TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matriculas (
    id TEXT PRIMARY KEY,
    id_estudiante TEXT NOT NULL,
    id_grupo TEXT NOT NULL,
    estado TEXT DEFAULT 'Activo',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_grupo) REFERENCES grupos(id)
);

-- 7. ASIGNACIÓN ACADÉMICA
CREATE TABLE IF NOT EXISTS asignacion_academica (
    id TEXT PRIMARY KEY,
    id_docente TEXT NOT NULL,
    id_asignatura TEXT NOT NULL,
    id_grupo TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_docente) REFERENCES usuarios(id),
    FOREIGN KEY (id_asignatura) REFERENCES asignaturas(id),
    FOREIGN KEY (id_grupo) REFERENCES grupos(id)
);

-- 8. PERIODOS ACADÉMICOS
CREATE TABLE IF NOT EXISTS periodos (
    id TEXT PRIMARY KEY,
    numero_periodo INTEGER NOT NULL,
    año_lectivo TEXT NOT NULL,
    estado_apertura INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. CALIFICACIONES
CREATE TABLE IF NOT EXISTS calificaciones_finales (
    id TEXT PRIMARY KEY,
    id_matricula TEXT NOT NULL,
    id_asignatura TEXT NOT NULL,
    id_periodo TEXT NOT NULL,
    id_docente TEXT NOT NULL,
    nota_definitiva REAL,
    faltas INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_matricula) REFERENCES matriculas(id),
    FOREIGN KEY (id_asignatura) REFERENCES asignaturas(id),
    FOREIGN KEY (id_periodo) REFERENCES periodos(id),
    FOREIGN KEY (id_docente) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS calificaciones_detalle (
    id TEXT PRIMARY KEY,
    id_calificacion_final TEXT NOT NULL,
    id_dimension_siee TEXT NOT NULL,
    nota REAL NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_calificacion_final) REFERENCES calificaciones_finales(id) ON DELETE CASCADE,
    FOREIGN KEY (id_dimension_siee) REFERENCES siee_dimensiones(id)
);