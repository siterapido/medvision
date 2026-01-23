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
}

export interface VisionMeta {
    imageType: 'Periapical' | 'Panorâmica' | 'Interproximal (Bitewing)' | 'Oclusal' | 'Foto Intraoral' | 'Tomografia' | 'Desconhecido';
    quality: 'Excelente' | 'Boa' | 'Aceitável' | 'Ruim' | 'Inadequada';
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
    // Legacy fields for compatibility if needed (frontend uses report now)
    clinicalAssessment?: string;
    recommendations?: string[];
}
