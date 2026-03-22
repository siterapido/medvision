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

export interface VisionReport {
    technicalAnalysis: string;
    detailedFindings: string;
    diagnosticHypothesis: string;
    recommendations: string[];
}

export interface VisionAnalysisResult {
    meta?: VisionMeta;
    detections: VisionDetection[];
    findings: VisionFinding[];
    report?: VisionReport;
    precision?: number; // 0-100 overall precision score
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
}
