export interface BoundingBox {
    ymin: number; // 0-100
    xmin: number; // 0-100
    ymax: number; // 0-100
    xmax: number; // 0-100
}

export type SeverityLevel = 'critical' | 'moderate' | 'normal';

export interface VisionDetection {
    id: string;
    label: string;
    confidence: number;
    box: BoundingBox;
    severity: SeverityLevel;
    description?: string;
    // Enhanced fields (optional for backward compatibility)
    toothNumber?: string;           // FDI notation e.g. "26", "11-13"
    cidCode?: string;               // CID-10 code e.g. "K02.1"
    differentialDiagnosis?: string[]; // 2-3 diagnostic alternatives
    clinicalSignificance?: 'alta' | 'media' | 'baixa';
    recommendedActions?: string[];  // per-detection next steps
    detailedDescription?: string;   // longer technical description
}

export interface VisionFinding {
    type: string;
    zone: string;
    level: string; // Para display (ex: "Crítico")
    color: string; // Tailwind class (ex: "text-red-500")
    confidence?: number; // 0-1 confidence score for this finding
}

export interface VisionMeta {
    imageType: 'Periapical' | 'Panorâmica' | 'Interproximal (Bitewing)' | 'Oclusal' | 'Foto Intraoral' | 'Tomografia' | 'Desconhecido';
    quality: 'Excelente' | 'Boa' | 'Aceitável' | 'Ruim' | 'Inadequada';
    qualityScore: number; // 0-100 technical quality score (required — matches API Zod schema)
    notes?: string;
}

export interface VisionPerToothBreakdown {
    tooth: string;       // FDI notation e.g. "26", "41-42"
    findings: string;    // description of findings for this tooth
    cidCode?: string;    // CID-10 code if applicable
    severity?: SeverityLevel;
}

export interface VisionReport {
    technicalAnalysis: string;
    detailedFindings: string;
    diagnosticHypothesis: string;
    recommendations: string[];
    // Enhanced fields (optional for backward compatibility)
    perToothBreakdown?: VisionPerToothBreakdown[];
    differentialDiagnosis?: string;
}

export interface VisionRefinement {
    regionBox: BoundingBox;          // the selected region in the original image (0-100 coords)
    regionImageBase64: string;       // cropped region image
    analysis: VisionAnalysisResult;  // refined analysis result for this region
    analyzedAt: string;              // ISO timestamp
}

export interface VisionAnalysisResult {
    meta?: VisionMeta;
    detections: VisionDetection[];
    findings: VisionFinding[];
    report?: VisionReport;
    precision?: number; // 0-100 overall precision score
    refinements?: VisionRefinement[];
    // Legacy fields for compatibility if needed (frontend uses report now)
    clinicalAssessment?: string;
    recommendations?: string[];
}

// Annotation types for user markup
export type AnnotationTool = 'pen' | 'circle' | 'arrow' | 'text';
export type AnnotationColor = 'red' | 'yellow' | 'blue' | 'white';

export interface VisionAnnotation {
    id: string;
    tool: AnnotationTool;
    color: AnnotationColor;
    points?: { x: number; y: number }[];  // for pen tool
    start?: { x: number; y: number };     // for shapes
    end?: { x: number; y: number };
    text?: string;                        // for text tool
}

// Artifact content structure for saving to biblioteca
export interface VisionArtifactContent {
    thumbnailBase64: string;              // 200x200 preview
    imageBase64: string;                  // Full image
    analysis: VisionAnalysisResult;
    annotations?: VisionAnnotation[];
    analyzedAt: string;
    refinements?: VisionRefinement[];
}
