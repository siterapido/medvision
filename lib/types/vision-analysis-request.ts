import { z } from 'zod'

import {
  VISION_MODALITY_IDS,
  VISION_PATIENT_SEX_VALUES,
  VISION_REPORT_DEPTH_IDS,
} from '@/lib/constants/vision-analysis-options'
import type {
  VisionModality,
  VisionPatientSex,
  VisionReportDepth,
  VisionReportSections,
} from '@/lib/constants/vision-analysis-options'
import { VISION_SPECIALTY_ORDER } from '@/lib/constants/vision-specialties'
import type { VisionSpecialty } from '@/lib/constants/vision-specialties/types'

const specialtyEnumOrder = VISION_SPECIALTY_ORDER as unknown as readonly [
  VisionSpecialty,
  ...VisionSpecialty[],
]

const specialtyEnum = z.enum(specialtyEnumOrder)

const visionModalityEnum = z.enum(
  VISION_MODALITY_IDS as unknown as [VisionModality, ...VisionModality[]],
)

const visionReportDepthEnum = z.enum(
  VISION_REPORT_DEPTH_IDS as unknown as [VisionReportDepth, ...VisionReportDepth[]],
)

const visionPatientSexEnum = z.enum(
  VISION_PATIENT_SEX_VALUES as unknown as [
    VisionPatientSex,
    ...VisionPatientSex[],
  ],
)

export const visionAnalysisRequestSchema = z.object({
  image: z.string().min(32),
  specialty: specialtyEnum.optional(),
  clinicalContext: z.string().max(500).optional(),
  modality: visionModalityEnum.optional(),
  reportDepth: visionReportDepthEnum.optional(),
  focusTags: z.array(z.string().min(1).max(80)).max(12).optional(),
  patientAge: z.number().int().min(0).max(120).optional(),
  patientSex: visionPatientSexEnum.optional(),
  reportSections: z
    .object({
      findings: z.boolean(),
      impression: z.boolean(),
      recommendations: z.boolean(),
      comparison: z.boolean(),
    })
    .optional(),
  mode: z.enum(['refine', 'quick', 'preview', 'detailed']).optional(),
  originalAnalysisSummary: z.string().optional(),
})

export type VisionAnalysisRequest = z.infer<typeof visionAnalysisRequestSchema>

export type MedVisionAnalysisConfig = {
  specialty: VisionSpecialty
  clinicalContext: string
  modality: VisionModality
  reportDepth: VisionReportDepth
  focusTags: string[]
  patientAge?: number
  patientSex?: VisionPatientSex
  reportSections: VisionReportSections
}
