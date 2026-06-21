import * as SQLite from 'expo-sqlite';
import { Company, Employee, Technician, Course, CourseTopic, Certificate } from '../types';

const db = SQLite.openDatabaseSync('traseme_certs.db');

export function initDatabase(): void {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      razaoSocial TEXT NOT NULL,
      cnpj TEXT NOT NULL UNIQUE,
      endereco TEXT NOT NULL DEFAULT '',
      cidade TEXT NOT NULL DEFAULT '',
      estado TEXT NOT NULL DEFAULT '',
      cep TEXT NOT NULL DEFAULT '',
      logoUri TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomeCompleto TEXT NOT NULL,
      funcao TEXT NOT NULL,
      cpf TEXT NOT NULL UNIQUE,
      companyId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS technicians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomeCompleto TEXT NOT NULL,
      funcao TEXT NOT NULL,
      registroDSST TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      duracaoHoras INTEGER NOT NULL,
      validadeAnos INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS course_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseId INTEGER NOT NULL,
      ordem INTEGER NOT NULL,
      topico TEXT NOT NULL,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numeroUnico TEXT NOT NULL UNIQUE,
      companyId INTEGER NOT NULL,
      employeeId INTEGER NOT NULL,
      courseId INTEGER NOT NULL,
      technicianId INTEGER NOT NULL,
      localRealizacao TEXT NOT NULL,
      dataRealizacao TEXT NOT NULL,
      dataValidade TEXT NOT NULL,
      pdfUri TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (companyId) REFERENCES companies(id),
      FOREIGN KEY (employeeId) REFERENCES employees(id),
      FOREIGN KEY (courseId) REFERENCES courses(id),
      FOREIGN KEY (technicianId) REFERENCES technicians(id)
    );
  `);
}

// ─── Companies ──────────────────────────────────────────────────────────────

export function getAllCompanies(): Company[] {
  return db.getAllSync<Company>('SELECT * FROM companies ORDER BY razaoSocial ASC');
}

export function getCompanyById(id: number): Company | null {
  return db.getFirstSync<Company>('SELECT * FROM companies WHERE id = ?', [id]) ?? null;
}

export function insertCompany(data: Omit<Company, 'id' | 'createdAt'>): number {
  const result = db.runSync(
    `INSERT INTO companies (razaoSocial, cnpj, endereco, cidade, estado, cep, logoUri) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.razaoSocial, data.cnpj, data.endereco, data.cidade, data.estado, data.cep, data.logoUri ?? null]
  );
  return result.lastInsertRowId;
}

export function updateCompany(id: number, data: Omit<Company, 'id' | 'createdAt'>): void {
  db.runSync(
    `UPDATE companies SET razaoSocial=?, cnpj=?, endereco=?, cidade=?, estado=?, cep=?, logoUri=? WHERE id=?`,
    [data.razaoSocial, data.cnpj, data.endereco, data.cidade, data.estado, data.cep, data.logoUri ?? null, id]
  );
}

export function deleteCompany(id: number): void {
  db.runSync('DELETE FROM companies WHERE id = ?', [id]);
}

// ─── Employees ───────────────────────────────────────────────────────────────

export function getEmployeesByCompany(companyId: number): Employee[] {
  return db.getAllSync<Employee>(
    'SELECT e.*, c.razaoSocial as companyName FROM employees e JOIN companies c ON e.companyId = c.id WHERE e.companyId = ? ORDER BY e.nomeCompleto ASC',
    [companyId]
  );
}

export function getAllEmployees(): Employee[] {
  return db.getAllSync<Employee>(
    'SELECT e.*, c.razaoSocial as companyName FROM employees e JOIN companies c ON e.companyId = c.id ORDER BY e.nomeCompleto ASC'
  );
}

export function getEmployeeById(id: number): Employee | null {
  return db.getFirstSync<Employee>(
    'SELECT e.*, c.razaoSocial as companyName FROM employees e JOIN companies c ON e.companyId = c.id WHERE e.id = ?',
    [id]
  ) ?? null;
}

export function insertEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'companyName'>): number {
  const result = db.runSync(
    `INSERT INTO employees (nomeCompleto, funcao, cpf, companyId) VALUES (?, ?, ?, ?)`,
    [data.nomeCompleto, data.funcao, data.cpf, data.companyId]
  );
  return result.lastInsertRowId;
}

export function updateEmployee(id: number, data: Omit<Employee, 'id' | 'createdAt' | 'companyName'>): void {
  db.runSync(
    `UPDATE employees SET nomeCompleto=?, funcao=?, cpf=?, companyId=? WHERE id=?`,
    [data.nomeCompleto, data.funcao, data.cpf, data.companyId, id]
  );
}

export function deleteEmployee(id: number): void {
  db.runSync('DELETE FROM employees WHERE id = ?', [id]);
}

// ─── Technicians ─────────────────────────────────────────────────────────────

export function getAllTechnicians(): Technician[] {
  return db.getAllSync<Technician>('SELECT * FROM technicians ORDER BY nomeCompleto ASC');
}

export function getTechnicianById(id: number): Technician | null {
  return db.getFirstSync<Technician>('SELECT * FROM technicians WHERE id = ?', [id]) ?? null;
}

export function insertTechnician(data: Omit<Technician, 'id' | 'createdAt'>): number {
  const result = db.runSync(
    `INSERT INTO technicians (nomeCompleto, funcao, registroDSST) VALUES (?, ?, ?)`,
    [data.nomeCompleto, data.funcao, data.registroDSST]
  );
  return result.lastInsertRowId;
}

export function updateTechnician(id: number, data: Omit<Technician, 'id' | 'createdAt'>): void {
  db.runSync(
    `UPDATE technicians SET nomeCompleto=?, funcao=?, registroDSST=? WHERE id=?`,
    [data.nomeCompleto, data.funcao, data.registroDSST, id]
  );
}

export function deleteTechnician(id: number): void {
  db.runSync('DELETE FROM technicians WHERE id = ?', [id]);
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export function getAllCourses(): Course[] {
  const courses = db.getAllSync<Omit<Course, 'topicos'>>('SELECT * FROM courses ORDER BY nome ASC');
  return courses.map((c) => ({
    ...c,
    topicos: getCourseTopics(c.id),
  }));
}

export function getCourseById(id: number): Course | null {
  const course = db.getFirstSync<Omit<Course, 'topicos'>>('SELECT * FROM courses WHERE id = ?', [id]);
  if (!course) return null;
  return { ...course, topicos: getCourseTopics(id) };
}

export function getCourseTopics(courseId: number): CourseTopic[] {
  return db.getAllSync<CourseTopic>(
    'SELECT * FROM course_topics WHERE courseId = ? ORDER BY ordem ASC',
    [courseId]
  );
}

export function insertCourse(data: Omit<Course, 'id' | 'createdAt'>): number {
  const result = db.runSync(
    `INSERT INTO courses (nome, duracaoHoras, validadeAnos) VALUES (?, ?, ?)`,
    [data.nome, data.duracaoHoras, data.validadeAnos]
  );
  const courseId = result.lastInsertRowId;
  insertCourseTopics(courseId, data.topicos);
  return courseId;
}

export function insertCourseTopics(courseId: number, topicos: CourseTopic[]): void {
  db.runSync('DELETE FROM course_topics WHERE courseId = ?', [courseId]);
  topicos.forEach((t) => {
    db.runSync(
      `INSERT INTO course_topics (courseId, ordem, topico) VALUES (?, ?, ?)`,
      [courseId, t.ordem, t.topico]
    );
  });
}

export function updateCourse(id: number, data: Omit<Course, 'id' | 'createdAt'>): void {
  db.runSync(
    `UPDATE courses SET nome=?, duracaoHoras=?, validadeAnos=? WHERE id=?`,
    [data.nome, data.duracaoHoras, data.validadeAnos, id]
  );
  insertCourseTopics(id, data.topicos);
}

export function deleteCourse(id: number): void {
  db.runSync('DELETE FROM courses WHERE id = ?', [id]);
}

// ─── Certificates ─────────────────────────────────────────────────────────────

export function getAllCertificates(): Certificate[] {
  const certs = db.getAllSync<Certificate>(
    `SELECT ce.*,
      co.razaoSocial as 'company.razaoSocial', co.cnpj as 'company.cnpj', co.logoUri as 'company.logoUri',
      co.endereco as 'company.endereco', co.cidade as 'company.cidade', co.estado as 'company.estado',
      e.nomeCompleto as 'employee.nomeCompleto', e.funcao as 'employee.funcao', e.cpf as 'employee.cpf',
      t.nomeCompleto as 'technician.nomeCompleto', t.funcao as 'technician.funcao', t.registroDSST as 'technician.registroDSST',
      cu.nome as 'course.nome', cu.duracaoHoras as 'course.duracaoHoras', cu.validadeAnos as 'course.validadeAnos'
     FROM certificates ce
     JOIN companies co ON ce.companyId = co.id
     JOIN employees e ON ce.employeeId = e.id
     JOIN technicians t ON ce.technicianId = t.id
     JOIN courses cu ON ce.courseId = cu.id
     ORDER BY ce.createdAt DESC`
  );
  return certs.map(flattenCertificate);
}

export function getCertificateById(id: number): Certificate | null {
  const cert = db.getFirstSync<any>(
    `SELECT ce.*,
      co.razaoSocial as 'company.razaoSocial', co.cnpj as 'company.cnpj', co.logoUri as 'company.logoUri',
      co.endereco as 'company.endereco', co.cidade as 'company.cidade', co.estado as 'company.estado',
      e.nomeCompleto as 'employee.nomeCompleto', e.funcao as 'employee.funcao', e.cpf as 'employee.cpf',
      t.nomeCompleto as 'technician.nomeCompleto', t.funcao as 'technician.funcao', t.registroDSST as 'technician.registroDSST',
      cu.nome as 'course.nome', cu.duracaoHoras as 'course.duracaoHoras', cu.validadeAnos as 'course.validadeAnos'
     FROM certificates ce
     JOIN companies co ON ce.companyId = co.id
     JOIN employees e ON ce.employeeId = e.id
     JOIN technicians t ON ce.technicianId = t.id
     JOIN courses cu ON ce.courseId = cu.id
     WHERE ce.id = ?`,
    [id]
  );
  if (!cert) return null;
  const flat = flattenCertificate(cert);
  if (flat.course) {
    flat.course.topicos = getCourseTopics(flat.courseId);
  }
  return flat;
}

function flattenCertificate(row: any): Certificate {
  const cert: any = {};
  const company: any = {};
  const employee: any = {};
  const technician: any = {};
  const course: any = {};

  for (const key of Object.keys(row)) {
    if (key.startsWith('company.')) company[key.replace('company.', '')] = row[key];
    else if (key.startsWith('employee.')) employee[key.replace('employee.', '')] = row[key];
    else if (key.startsWith('technician.')) technician[key.replace('technician.', '')] = row[key];
    else if (key.startsWith('course.')) course[key.replace('course.', '')] = row[key];
    else cert[key] = row[key];
  }

  return { ...cert, company, employee, technician, course };
}

export function insertCertificate(data: Omit<Certificate, 'id' | 'createdAt' | 'company' | 'employee' | 'course' | 'technician'>): number {
  const result = db.runSync(
    `INSERT INTO certificates (numeroUnico, companyId, employeeId, courseId, technicianId, localRealizacao, dataRealizacao, dataValidade, pdfUri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.numeroUnico, data.companyId, data.employeeId, data.courseId, data.technicianId, data.localRealizacao, data.dataRealizacao, data.dataValidade, data.pdfUri ?? null]
  );
  return result.lastInsertRowId;
}

export function updateCertificatePdf(id: number, pdfUri: string): void {
  db.runSync('UPDATE certificates SET pdfUri = ? WHERE id = ?', [pdfUri, id]);
}

export function deleteCertificate(id: number): void {
  db.runSync('DELETE FROM certificates WHERE id = ?', [id]);
}

// ─── App Settings (auto-save drafts) ─────────────────────────────────────────

export function saveSetting(key: string, value: string): void {
  db.runSync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
}

export function getSetting(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export function deleteSetting(key: string): void {
  db.runSync('DELETE FROM app_settings WHERE key = ?', [key]);
}

// ─── Export / Import ──────────────────────────────────────────────────────────

export interface BackupData {
  version: number;
  exportedAt: string;
  companies: Company[];
  employees: Employee[];
  technicians: Technician[];
  courses: Course[];
  certificates: Array<Omit<Certificate, 'company' | 'employee' | 'course' | 'technician'>>;
}

export function exportAllData(): string {
  const companies = db.getAllSync<Company>('SELECT * FROM companies ORDER BY id ASC');
  const employees = db.getAllSync<Employee>('SELECT * FROM employees ORDER BY id ASC');
  const technicians = db.getAllSync<Technician>('SELECT * FROM technicians ORDER BY id ASC');
  const rawCourses = db.getAllSync<Omit<Course, 'topicos'>>('SELECT * FROM courses ORDER BY id ASC');
  const courses: Course[] = rawCourses.map((c) => ({ ...c, topicos: getCourseTopics(c.id) }));
  const certificates = db.getAllSync<Omit<Certificate, 'company' | 'employee' | 'course' | 'technician'>>(
    'SELECT * FROM certificates ORDER BY id ASC'
  );

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    companies,
    employees,
    technicians,
    courses,
    certificates,
  };
  return JSON.stringify(backup, null, 2);
}

export function importAllData(json: string): { count: number; error?: string } {
  let data: BackupData;
  try {
    data = JSON.parse(json) as BackupData;
    if (!data.version || !data.companies) throw new Error('Arquivo inválido');
  } catch (e: any) {
    return { count: 0, error: e?.message ?? 'Formato inválido' };
  }

  db.execSync('PRAGMA foreign_keys = OFF;');
  let count = 0;
  try {
    db.execSync(`
      DELETE FROM certificates;
      DELETE FROM course_topics;
      DELETE FROM courses;
      DELETE FROM employees;
      DELETE FROM technicians;
      DELETE FROM companies;
    `);

    for (const c of data.companies ?? []) {
      db.runSync(
        'INSERT INTO companies (id, razaoSocial, cnpj, endereco, cidade, estado, cep, logoUri, createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
        [c.id, c.razaoSocial, c.cnpj, c.endereco, c.cidade, c.estado, c.cep, c.logoUri ?? null, c.createdAt]
      );
      count++;
    }
    for (const e of data.employees ?? []) {
      db.runSync(
        'INSERT INTO employees (id, nomeCompleto, funcao, cpf, companyId, createdAt) VALUES (?,?,?,?,?,?)',
        [e.id, e.nomeCompleto, e.funcao, e.cpf, e.companyId, e.createdAt]
      );
      count++;
    }
    for (const t of data.technicians ?? []) {
      db.runSync(
        'INSERT INTO technicians (id, nomeCompleto, funcao, registroDSST, createdAt) VALUES (?,?,?,?,?)',
        [t.id, t.nomeCompleto, t.funcao, t.registroDSST, t.createdAt]
      );
      count++;
    }
    for (const c of data.courses ?? []) {
      db.runSync(
        'INSERT INTO courses (id, nome, duracaoHoras, validadeAnos, createdAt) VALUES (?,?,?,?,?)',
        [c.id, c.nome, c.duracaoHoras, c.validadeAnos, c.createdAt]
      );
      for (const t of c.topicos ?? []) {
        db.runSync(
          'INSERT INTO course_topics (courseId, ordem, topico) VALUES (?,?,?)',
          [c.id, t.ordem, t.topico]
        );
      }
      count++;
    }
    for (const ce of data.certificates ?? []) {
      db.runSync(
        'INSERT INTO certificates (id, numeroUnico, companyId, employeeId, courseId, technicianId, localRealizacao, dataRealizacao, dataValidade, pdfUri, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [ce.id, ce.numeroUnico, ce.companyId, ce.employeeId, ce.courseId, ce.technicianId, ce.localRealizacao, ce.dataRealizacao, ce.dataValidade, ce.pdfUri ?? null, ce.createdAt]
      );
      count++;
    }
  } catch (e: any) {
    return { count: 0, error: e?.message ?? 'Erro ao importar' };
  } finally {
    db.execSync('PRAGMA foreign_keys = ON;');
  }

  return { count };
}
