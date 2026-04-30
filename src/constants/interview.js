/**
 * 면접 도메인 상수.
 * 문자열 리터럴이 코드 곳곳에 흩어지면 오타가 버그가 되니 한 곳에 모아둔다.
 */

// 세션 상태
export const SESSION_STATUS = {
  IN_PROGRESS: "in_progress", // 진행 중
  COMPLETED: "completed", // 정상 종료 (회고까지 작성됨)
  ABANDONED: "abandoned", // 중간에 나감
};

// 메시지 발화자
export const MESSAGE_ROLE = {
  INTERVIEWER: "interviewer", // 면접관 (Claude)
  CANDIDATE: "candidate", // 면접자
};

// 메시지 유형
export const MESSAGE_TYPE = {
  OPENING: "opening", // 면접관의 인삿말
  QUESTION: "question", // 메인 질문
  ANSWER: "answer", // 사용자 답변
  FEEDBACK: "feedback", // 답변에 대한 피드백
  FOLLOW_UP: "follow_up", // 꼬리 질문
  CLOSING: "closing", // 마무리 발화
};

// ─── 면접 설정 옵션 ─────────────────────────────────────────

// 직무 프리셋 (자유 입력도 허용할 거지만 빠른 선택용)
export const JOB_ROLES = [
  "백엔드 개발자",
  "프론트엔드 개발자",
  "풀스택 개발자",
  "AI/ML 엔지니어",
  "데이터 엔지니어",
  "데이터 분석가",
  "DevOps 엔지니어",
  "모바일 앱 개발자",
  "게임 클라이언트 개발자",
  "임베디드/펌웨어 개발자",
  "보안 엔지니어",
  "QA 엔지니어",
];

// 회사 타입
export const COMPANY_TYPES = [
  {
    id: "startup",
    label: "스타트업",
    hint: "빠른 실행·다재다능함·자율성 강조",
  },
  {
    id: "sme",
    label: "중소·중견기업",
    hint: "실무 즉시 투입·도메인 지식 강조",
  },
  { id: "enterprise", label: "대기업", hint: "CS 기초·시스템 설계·협업 강조" },
  {
    id: "bigtech",
    label: "빅테크/외국계",
    hint: "알고리즘·시스템 디자인·영문 커뮤니케이션",
  },
  { id: "public", label: "공공·금융", hint: "안정성·보안·규제 준수 강조" },
  {
    id: "agency",
    label: "SI/에이전시",
    hint: "다양한 프로젝트·일정 관리·고객 응대",
  },
];

// 기술 스택 프리셋 — 카테고리별로 묶어둔다
export const TECH_STACK_PRESETS = {
  언어: [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "Kotlin",
    "Go",
    "Rust",
    "C++",
    "C#",
    "Swift",
    "PHP",
    "Ruby",
  ],
  프론트엔드: [
    "React",
    "Next.js",
    "Vue",
    "Nuxt",
    "Svelte",
    "Tailwind CSS",
    "Redux",
    "Zustand",
    "TanStack Query",
  ],
  백엔드: [
    "Node.js",
    "Express",
    "NestJS",
    "FastAPI",
    "Django",
    "Flask",
    "Spring Boot",
    "Laravel",
    "Ruby on Rails",
  ],
  "데이터/AI": [
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "Elasticsearch",
    "Kafka",
    "Airflow",
    "PyTorch",
    "TensorFlow",
    "LangChain",
  ],
  인프라: [
    "AWS",
    "GCP",
    "Azure",
    "Docker",
    "Kubernetes",
    "Terraform",
    "GitHub Actions",
    "Jenkins",
    "Nginx",
  ],
};

// 경력 수준
export const EXPERIENCE_LEVELS = [
  { id: "newbie", label: "신입 (0~1년)" },
  { id: "junior", label: "주니어 (1~3년)" },
  { id: "mid", label: "미드 (3~7년)" },
  { id: "senior", label: "시니어 (7년+)" },
];

export const DEFAULT_EXPERIENCE = "junior";
