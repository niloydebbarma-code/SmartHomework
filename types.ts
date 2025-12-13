

// Box coordinates are normalized 0-1000
export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface ValidationCheck {
  status: 'verified' | 'warning';
  confidenceScore: number; // 0-100
  renderingNote?: string; // e.g., "Complex LaTeX detected, verify brackets"
}

export interface VisualValidation {
  isAccurate: boolean;
  critique?: string; // The AI's feedback on why it might be wrong
  modelUsed?: string; // Track which model was used
}

export interface ProblemAnalysis {
  id: number;
  subject?: string; // e.g., "Chemistry"
  topic?: string;   // e.g., "Organic Chemistry - Benzene Rings"
  
  isCorrect?: boolean | null; // true/false if checking, null if teaching mode
  boundingBox?: BoundingBox | null; // Only present if incorrect and image source
  explanation: string; // Brief explanation or solution summary
  steps: string[]; // Detailed step-by-step solution
  
  // New fields for Solve & Teach mode
  problemStatement?: string;
  keyConcepts?: string[];
  studentAnswer?: string | null;

  // New field for Quality Assurance
  validation?: ValidationCheck;

  // New fields for Visual Aids
  visualAidPrompt?: string | null; // If the AI thinks a diagram is needed
  visualAidType?: 'image' | 'svg'; // Type of visual aid
  generatedVisualContent?: string | null; // The URL (image) or Code (SVG)
  visualValidation?: VisualValidation; // The result of the SVG verification check
}

export interface HomeworkResponse {
  hasStudentSolution: boolean;
  problems: ProblemAnalysis[];
  modelUsed?: string; // Track which model (Pro/Flash) was used
}

export interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  audioEnabled: boolean;
}

export enum FontSize {
  NORMAL = 'text-base',
  LARGE = 'text-lg',
  EXTRA_LARGE = 'text-xl'
}

export interface WebSource {
  uri: string;
  title: string;
}

// -- VIDEO TUTOR SPECIFIC TYPES --
export interface FactCheckItem {
  claim: string;
  verdict: 'verified' | 'disputed' | 'outdated';
  correction?: string;
  source?: string;
}

export interface VideoAnalysisMetadata {
  ocrText?: string;
  factChecks?: FactCheckItem[];
}

// -- EXAM SPECIFIC TYPES --
export interface GradingAudit {
  auditedScore: string;
  fairnessScore: number; // 0-100
  discrepancies: string[];
  feedback: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: WebSource[]; // For Google Search Grounding
  // New for Math Lab
  codeSnippet?: string; // Python code if generated
  codeOutput?: string; // Result of execution
  // New for Video
  timestamp?: number; // Related timestamp
  modelUsed?: string; // Track model for transparency
  // NEW: Metadata for rich UI
  videoAnalysis?: VideoAnalysisMetadata;
  examAudit?: GradingAudit;
}

export type InputMode = 'file' | 'text';

export interface AnalysisInput {
  type: 'image' | 'text';
  data: string;
  mimeType?: string;
  textContext?: string; // Optional extracted text for better accuracy
}

// New Types for Math Lab
export interface MathLabResponse {
  latex: string; // The visual representation of the problem
  explanation: string;
  pythonCode: string;
  result: string;
  plotSvg?: string; // NEW: For graphs
  modelUsed?: string; // Track model
  sources?: WebSource[]; // For real-world math data
  wasAutoRepaired?: boolean; // NEW: Indicates if the self-correction loop ran
}

// New Types for Exam Prep
export interface ExamConfig {
  subject: string;
  gradeLevel: string; // e.g., "10th Grade, Semester 2"
  totalMarks?: string; // e.g., "100"
  numberOfQuestions?: number; // e.g. 10
  institutionGuidelines?: string; // Free text for school rules
  questionFormats: string[]; // e.g., ["MCQ", "Essay", "Short Answer"]
  realWorldMode?: boolean; // New: Enable search for current events
  strictMode?: boolean; // New: Simulator mode (no hints, timer, grade at end)
  durationMinutes?: number; // New: Timer duration
}