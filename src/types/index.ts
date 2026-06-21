export interface Company {
  id: number;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  logoUri?: string;
  createdAt: string;
}

export interface Employee {
  id: number;
  nomeCompleto: string;
  funcao: string;
  cpf: string;
  companyId: number;
  companyName?: string;
  createdAt: string;
}

export interface Technician {
  id: number;
  nomeCompleto: string;
  funcao: string;
  registroDSST: string;
  createdAt: string;
}

export interface CourseTopic {
  id?: number;
  courseId?: number;
  ordem: number;
  topico: string;
}

export interface Course {
  id: number;
  nome: string;
  codigo?: string;
  duracaoHoras: number;
  validadeAnos: number;
  topicos: CourseTopic[];
  createdAt: string;
}

export interface Certificate {
  id: number;
  numeroUnico: string;
  companyId: number;
  employeeId: number;
  courseId: number;
  technicianId: number;
  localRealizacao: string;
  dataRealizacao: string;
  dataValidade: string;
  pdfUri?: string;
  createdAt: string;
  company?: Company;
  employee?: Employee;
  course?: Course;
  technician?: Technician;
}

export type RootStackParamList = {
  MainTabs: undefined;
  CompanyForm: { companyId?: number };
  CompanyDetail: { companyId: number };
  EmployeeForm: { employeeId?: number; companyId?: number };
  EmployeeDetail: { employeeId: number };
  CourseForm: { courseId?: number };
  CourseDetail: { courseId: number };
  TechnicianForm: { technicianId?: number };
  TechnicianDetail: { technicianId: number };
  CertificateIssue: undefined;
  BatchCertificateIssue: undefined;
  CertificatePreview: { certificateId: number };
  CertificateDetail: { certificateId: number };
};

export type TabParamList = {
  Companies: undefined;
  Courses: undefined;
  Certificates: undefined;
  Technicians: undefined;
  Settings: undefined;
};
