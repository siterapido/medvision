# Performance Analysis Report

## Executive Summary
This report analyzes the performance metrics from the simulated user interactions stored in `simulated_raw_data.json`. The focus is on Latency (Duration) and Time to First Token (TTFT) across different complexity levels of user queries.

## Metrics Analysis

### Scenario 1: Greeting (Simple)
*   **Input**: "Olá, tudo bem? Sou um novo paciente."
*   **TTFT**: 0.12s
*   **Total Duration**: 0.45s
*   **Status**: ✅ Excellent. The system responds almost instantaneously, well within the "perceived instant" threshold (usually < 200ms).

### Scenario 2: Complex Research (Complex)
*   **Input**: "Doutor, tenho diabetes controlada e quero fazer implante..."
*   **TTFT**: 1.15s
*   **Total Duration**: 4.82s
*   **Status**: ⚠️ Needs Improvement.
    *   **Target TTFT**: < 0.8s
    *   **Actual TTFT**: 1.15s (+43.75% over target)

## Deep Dive: Complex Scenario Analysis

The "Complex Research" scenario involves an agent switch (`odonto-research`) and a tool call (`search_pubmed`). The raw event log indicates the following sequence:
1.  Agent Switch
2.  Tool Call (`search_pubmed`)
3.  Tool Result
4.  Text Generation (First Token)

**Critique:**
The TTFT of 1.15s exceeds the user experience target of 0.8s. This delay is likely caused by the synchronous blocking nature of the tool call. The model waits for the `search_pubmed` results before emitting any tokens to the user. While a total duration of 4.82s is acceptable for a researched answer, the initial "dead air" of over 1 second can make the interface feel sluggish or unresponsive.

## Optimization Recommendations

To bring the TTFT under the 0.8s target, the following strategies are recommended:

### 1. Speculative Streaming / Acknowledgement
**Strategy**: Do not wait for the tool result to begin streaming.
**Implementation**: The agent should be trained or prompted to emit an immediate acknowledgement or "thinking" state token before or in parallel with the tool call.
*   *Current*: [Tool Call] -> [Wait] -> [Result] -> "A informação..."
*   *Proposed*: "Vou verificar as pesquisas recentes sobre isso..." -> [Tool Call] -> [Result] -> "A informação..."
This effectively reduces perceived TTFT to near-zero, masking the backend latency.

### 2. Parallel Execution / Pre-fetching
**Strategy**: If the intent classification model (Router) can predict the need for specific evidence (e.g., "diabetes + implants"), trigger the search in parallel with the generation of the introductory text.

### 3. Caching Layer
**Strategy**: Implement a semantic cache (e.g., Redis or Vector DB) for high-frequency medical queries.
**Implementation**: "Diabetes and Implants" is a common topic. If a similar query result exists in the cache (TTL ~24h), bypass the external `search_pubmed` tool entirely. This would drop TTFT to near the "Greeting" levels (~0.1-0.2s).

### 4. Tool Optimization
**Strategy**: Optimize the `search_pubmed` tool performance.
**Implementation**: Ensure the tool is not fetching excessive data fields or waiting for unnecessary handshakes. If the tool itself takes 0.5s+, any network jitter pushes the total over 0.8s.

## Action Plan
1.  **Immediate**: Implement "Streaming Acknowledgement" to provide instant feedback to the user.
2.  **Short-term**: Audit the `search_pubmed` tool latency.
3.  **Medium-term**: Implement semantic caching for frequent clinical questions.
