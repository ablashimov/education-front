export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: PaginationMeta;
  links?: PaginationLink[];
}

export interface BackendOrganization {
  id: number;
  name: string;
  status_id: number;
}

export interface BackendRole {
  id: number;
  name: string;
  title?: string | null;
  settings?: Record<string, unknown> | null;
}

export interface BackendCourse {
  id: number;
  title: string;
  slug: string;
  is_available: boolean;
  settings: Record<string, unknown> | null;
  modules?: BackendModule[];
}

export interface BackendLesson {
  id: number;
  title: string;
  material: string | null;
  order: number;
  settings: Record<string, unknown> | null;
  files?: BackendFile[];
}

export interface BackendModule {
  id: number;
  title: string;
  order: number;
  settings: Record<string, unknown> | null;
  lessons?: BackendLesson[];
}

export interface BackendFile {
  id: number;
  path: string;
  path_url: string;
  name: string;
  size: number;
  mimetype: string;
  description: string | null;
}

export interface BackendExam {
  id: number;
  title: string;
  description: string | null;
  attempts_allowed: number;
  time_limit: number | null;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BackendExamResultStatus {
  id: number;
  name: string;
  slug: string;
}

export interface BackendExamAssignment {
  id: number;
  attempts_allowed: number;
  group_id: number;
  is_control: boolean;
  start_at: string | null;
  end_at: string | null;
  exam?: BackendExam;
  instances?: BackendExamInstance[];
  result?: BackendExamResultStatus;
  group?: BackendGroup;
  user?: BackendUser; // present in ExamAssigmentResource for /results
  attempt?: BackendExamAttempt; // present in ExamAssigmentResource for /results
  created_at: string;
  updated_at: string;
}

export interface BackendExamInstanceQuestion {
  id: number;
  text: string;
  score: number;
  question_type?: {
    id: number;
    name: string;
    slug?: string;
  } | null;
  metadata?: Record<string, unknown> | null;
  choices: Record<string, unknown> | null;
}

export interface BackendExamQuestion {
  id: number;
  text: string;
  score: number;
  question_type?: {
    id: number;
    name: string;
    slug?: string;
  } | null;
  metadata?: Record<string, unknown> | null;
}

export interface BackendExamInstance {
  id: number;
  assignment_id: number;
  user_id: number;
  attempt_number: number;
  start_at: string | null;
  end_at: string | null;
  questions?: BackendExamInstanceQuestion[];
  assignment?: BackendExamAssignment;
  attempt?: BackendExamAttempt;
}

export interface BackendExamAnswer {
  id: number;
  exam_attempt_id: number;
  question_id: number;
  answer: string;
  is_correct: boolean | null;
  graded_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface BackendExamAttempt {
  id: number;
  exam_instance_id: number;
  started_at: string;
  submitted_at: string | null;
  elapsed_seconds: number | null;
  score: number | null;
  answers?: BackendExamAnswer[];
}

export interface BackendGroupExamSchedule {
  id: number;
  exam_id: number;
  start_date: string | null;
  end_date: string | null;
  exam?: BackendExam;
}

export interface BackendGroup {
  id: number;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  course?: BackendCourse | null;
  schedule?: BackendGroupExamSchedule;
  created_at: string;
  updated_at: string;
}

export interface BackendUser {
  id: number;
  name: string;
  email: string;
  rank?: string | null;
  status_id?: number | null;
  email_verified_at: string | null;
  last_login_at?: string | null;
  organization?: BackendOrganization | null;
  roles?: BackendRole[];
  created_at?: string;
  updated_at?: string;
}

export interface BackendUserGroupInvite {
  id: number;
  user?: BackendUser;
  invited_at: string;
  accepted_at: string | null;
}
