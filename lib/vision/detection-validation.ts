export interface BoundingBox {
    ymin: number
    xmin: number
    ymax: number
    xmax: number
}

function calculateOverlap(box1: BoundingBox, box2: BoundingBox): number {
    const x1 = Math.max(box1.xmin, box2.xmin)
    const y1 = Math.max(box1.ymin, box2.ymin)
    const x2 = Math.min(box1.xmax, box2.xmax)
    const y2 = Math.min(box1.ymax, box2.ymax)

    if (x2 < x1 || y2 < y1) return 0

    const overlapArea = (x2 - x1) * (y2 - y1)
    const box1Area = (box1.xmax - box1.xmin) * (box1.ymax - box1.ymin)
    const box2Area = (box2.xmax - box2.xmin) * (box2.ymax - box2.ymin)
    const minArea = Math.min(box1Area, box2Area)

    return minArea > 0 ? overlapArea / minArea : 0
}

function calculateCenter(box: BoundingBox): { x: number; y: number } {
    return {
        x: (box.xmin + box.xmax) / 2,
        y: (box.ymin + box.ymax) / 2,
    }
}

function calculateDistance(box1: BoundingBox, box2: BoundingBox): number {
    const c1 = calculateCenter(box1)
    const c2 = calculateCenter(box2)
    return Math.sqrt((c2.x - c1.x) ** 2 + (c2.y - c1.y) ** 2)
}

function boxFromArray(box: number[]): BoundingBox {
    return {
        ymin: Math.max(0, Math.min(box[0] ?? 0, box[2] ?? 0)),
        xmin: Math.max(0, Math.min(box[1] ?? 0, box[3] ?? 0)),
        ymax: Math.min(100, Math.max(box[0] ?? 0, box[2] ?? 0)),
        xmax: Math.min(100, Math.max(box[1] ?? 0, box[3] ?? 0)),
    }
}

export interface DetectionInput {
    id: string
    label: string
    box: number[]
    confidence: number
    severity: 'critical' | 'moderate' | 'normal'
    [key: string]: unknown
}

/**
 * Normaliza boxes, reduz confiança em boxes enormes e funde sobreposições óbvias.
 * Ao aplicar merge, usa o índice **original** da lista (não o índice após o filter).
 */
export function validateAndMergeDetections(detections: DetectionInput[]): DetectionInput[] {
    if (detections.length === 0) return detections

    const validated = detections.map((d, index) => {
        const b = boxFromArray(d.box)

        let confidence = d.confidence ?? 0.85
        const boxWidth = b.xmax - b.xmin
        const boxHeight = b.ymax - b.ymin
        const boxArea = boxWidth * boxHeight

        if (boxArea > 50) {
            console.warn(`Detection "${d.label}" (${index}) has oversized box (${boxArea.toFixed(1)}% of image), reducing confidence by 20%`)
            confidence = Math.max(0.1, confidence * 0.8)
        }

        if (boxWidth > 80 || boxHeight > 80) {
            console.warn(`Detection "${d.label}" (${index}) has extremely large box, marking as low precision`)
            confidence = Math.max(0.1, confidence * 0.5)
        }

        return {
            ...d,
            box: [b.ymin, b.xmin, b.ymax, b.xmax],
            confidence,
            _warnings: [] as string[],
        }
    })

    const toRemove = new Set<number>()
    const toMerge: { indices: number[]; merged: DetectionInput }[] = []

    for (let i = 0; i < validated.length; i++) {
        if (toRemove.has(i)) continue

        const overlapping: number[] = [i]
        const bi = boxFromArray(validated[i].box)

        for (let j = i + 1; j < validated.length; j++) {
            if (toRemove.has(j)) continue

            const bj = boxFromArray(validated[j].box)
            const overlap = calculateOverlap(bi, bj)

            if (overlap > 0.3) {
                overlapping.push(j)
                toRemove.add(j)
            } else {
                const distance = calculateDistance(bi, bj)
                if (distance < 5 && validated[i].label.toLowerCase() === validated[j].label.toLowerCase()) {
                    overlapping.push(j)
                    toRemove.add(j)
                }
            }
        }

        if (overlapping.length > 1) {
            const boxes = overlapping.map((idx) => boxFromArray(validated[idx].box))

            const mergedBox: BoundingBox = {
                ymin: Math.min(...boxes.map((b) => b.ymin)),
                xmin: Math.min(...boxes.map((b) => b.xmin)),
                ymax: Math.max(...boxes.map((b) => b.ymax)),
                xmax: Math.max(...boxes.map((b) => b.xmax)),
            }

            const avgConfidence = overlapping.reduce((sum, idx) => sum + validated[idx].confidence, 0) / overlapping.length
            const highestSeverity = overlapping.some((idx) => validated[idx].severity === 'critical')
                ? 'critical'
                : overlapping.some((idx) => validated[idx].severity === 'moderate')
                  ? 'moderate'
                  : 'normal'

            const merged: DetectionInput = {
                ...validated[i],
                id: `det-merged-${i}`,
                box: [mergedBox.ymin, mergedBox.xmin, mergedBox.ymax, mergedBox.xmax],
                confidence: avgConfidence,
                severity: highestSeverity,
                label: validated[i].label,
                _warnings: [`Merged ${overlapping.length} overlapping detections`],
            }

            toMerge.push({ indices: overlapping, merged })
        }
    }

    const kept = validated
        .map((d, originalIdx) => ({ d, originalIdx }))
        .filter(({ originalIdx }) => !toRemove.has(originalIdx))

    const result = kept.map(({ d, originalIdx }, newIdx) => {
        const mergedRef = toMerge.find((m) => m.indices.includes(originalIdx))
        if (mergedRef) {
            return { ...mergedRef.merged, id: `det-${newIdx}` }
        }
        return { ...d, id: `det-${newIdx}` }
    })

    if (toRemove.size > 0) {
        console.log(`Validation: merged ${toRemove.size} overlapping/duplicate detections`)
    }

    return result
}
