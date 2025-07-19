# 고객 서비스 에이전트 시스템 종합 문서

이 문서는 OpenAI Agent SDK 기반 항공사 고객 서비스 시스템의 전체 API, 주요 컴포넌트, 커스텀 훅, 타입, 에이전트/툴 구조, 사용법, 예시를 한글로 안내합니다.

---

## 1. 프로젝트 개요

- **다중 에이전트 아키텍처**: Triage Agent가 요청을 분석해 FAQ, 좌석, 수하물 등 전문 에이전트로 위임합니다.
- **툴(도구) 시스템**: 각 에이전트는 명확한 목적의 툴을 보유하며, zod 스키마로 파라미터를 엄격히 정의합니다.
- **컨텍스트 관리**: 대화 상태와 데이터를 Context 객체로 에이전트 간 안전하게 전달합니다.
- **가드레일(Guardrail)**: 입력/출력 검증을 통해 시스템의 안정성과 일관성을 보장합니다.
- **실행 및 시각화**: Next.js API Route(`/api/chat`)에서 전체 흐름을 관리하며, 프론트엔드는 채팅/컨텍스트/이벤트 패널로 시각화합니다.

---

## 2. API 엔드포인트

### 2.1. 에이전트 목록 조회
- **GET /api/agents**
- **설명**: 사용 가능한 모든 에이전트 목록을 반환합니다.
- **응답 예시**
```json
{
  "agents": [
    {
      "name": "Triage Agent",
      "description": "고객 요청 라우팅",
      "handoffs": ["FAQ Agent", "Seat Booking Agent", ...],
      "tools": [],
      "status": "available",
      "specialty": "Customer Request Routing"
    },
    ...
  ],
  "currentAgent": "Triage Agent"
}
```

### 2.2. 특정 에이전트의 Guardrail 목록
- **GET /api/agents/[agentName]/guardrails**
- **설명**: 해당 에이전트에 적용된 입력/출력 가드레일 목록 반환
- **응답 예시**
```json
{
  "agentName": "FAQ Agent",
  "guardrails": [
    { "name": "Relevance Guardrail", "description": "입력 관련성 검증", "type": "input" },
    { "name": "Content Length Guardrail", "description": "출력 길이 검증", "type": "output" }
  ]
}
```

### 2.3. 특정 에이전트의 Tool 목록
- **GET /api/agents/[agentName]/tools**
- **설명**: 해당 에이전트가 사용할 수 있는 툴 목록 반환
- **응답 예시**
```json
{
  "agentName": "Baggage Agent",
  "tools": [
    {
      "name": "baggage_status_tool",
      "description": "수하물 상태 확인",
      "arguments": {
        "claimNumber": { "type": "string", "description": "수하물 클레임 번호", "required": true }
      }
    },
    ...
  ]
}
```

### 2.4. 채팅/대화 API
- **POST /api/chat**
- **설명**: 메시지를 보내고, 에이전트 응답/이벤트/가드레일 결과를 받습니다.
- **요청 예시**
```json
{
  "conversationId": "(선택) 기존 대화 ID",
  "message": "비행기 좌석을 변경하고 싶어요"
}
```
- **응답 예시**
```json
{
  "conversationId": "abc123",
  "currentAgent": "Seat Booking Agent",
  "messages": [
    { "role": "user", "content": "비행기 좌석을 변경하고 싶어요", "timestamp": "..." },
    { "role": "assistant", "content": "변경을 원하는 좌석 번호를 알려주세요.", "agent": "Seat Booking Agent", "timestamp": "..." }
  ],
  "context": { ... },
  "guardrails": [ ... ],
  "events": [ ... ]
}
```

---

## 3. 주요 컴포넌트

### 3.1. AgentsHeader
- **설명**: 에이전트 목록, 현재 선택, 애니메이션/새로고침 지원
- **Props**:
  - `agents: AgentInfo[]` (에이전트 목록)
  - `currentAgent: string` (현재 에이전트)
  - `isLoading: boolean` (로딩 상태)
  - `onRefresh?: () => void` (새로고침 콜백)
  - `onAgentSelect?: (agentName: string) => void` (에이전트 선택 콜백)
- **예시**:
```tsx
<AgentsHeader agents={agents} currentAgent={currentAgent} isLoading={false} onAgentSelect={...} />
```

### 3.2. ChatPanel
- **설명**: 채팅 메시지 표시 및 입력, 전송
- **Props**:
  - `messages: ChatMessage[]`
  - `currentAgent: string`
  - `isLoading: boolean`
  - `onSendMessage: (message: string) => void`
- **예시**:
```tsx
<ChatPanel messages={messages} currentAgent={currentAgent} isLoading={false} onSendMessage={...} />
```

### 3.3. ContextPanel
- **설명**: 현재 컨텍스트, 사용 가능한 툴, 가드레일 정보 표시
- **Props**:
  - `context: AirlineContext | BaggageContext | null`
  - `currentAgent: string`
  - `tools: ToolInfo[]`
  - `guardrails: AgentGuardrailInfo[]`
  - `executedGuardrails: GuardrailInfo[]`
  - 기타 로딩/에러 상태

### 3.4. EventsPanel
- **설명**: 시스템 이벤트(메시지, 툴 호출, 핸드오프 등) 타임라인 표시
- **Props**:
  - `events: AgentEvent[]`

### 3.5. ThemeProvider
- **설명**: 다크/라이트 테마 지원
- **예시**:
```tsx
<ThemeProvider attribute="class">...</ThemeProvider>
```

---

## 4. 커스텀 훅

### useAgentAnimation
- **설명**: 에이전트 애니메이션 상태 관리 (활성/애니메이션/사이클)
- **파라미터**:
  - `agents: Array<{ name: string }>`
  - `currentAgent: string`
  - `onAnimationComplete?: () => void`
- **반환값**:
  - `isAnimating`, `phase`, `cycleCount`, `startAnimation`, `stopAnimation`, `isAgentAnimated`, `isAgentActive`
- **예시**:
```ts
const { isAnimating, startAnimation, stopAnimation, isAgentAnimated, isAgentActive } = useAgentAnimation({ agents, currentAgent })
```

---

## 5. 주요 타입

- `AirlineContext`, `BaggageContext`: 대화 컨텍스트(승객, 항공편, 수하물 등)
- `ChatMessage`: 채팅 메시지(역할, 내용, 에이전트, 타임스탬프)
- `AgentInfo`: 에이전트 정보(이름, 설명, handoff, 툴, 상태)
- `ToolInfo`: 툴 정보(이름, 설명, 파라미터)
- `AgentEvent`: 시스템 이벤트(메시지, 핸드오프, 툴 호출 등)
- `GuardrailInfo`: 가드레일 실행 결과

---

## 6. 에이전트/툴 구조

- **에이전트**: FAQ, Baggage, Seat Booking, Flight Status, Cancellation, Triage 등
- **툴**: 각 에이전트별로 명확한 목적의 툴 보유 (예: `faq_lookup_tool`, `update_seat`, `baggage_status_tool` 등)
- **가드레일**: 입력/출력 검증 (예: 관련성, 길이)
- **핸드오프**: Triage Agent가 적절한 에이전트로 위임

---

## 7. 사용법

### 프로젝트 실행
```bash
pnpm install
pnpm dev
```

### API 호출 예시 (curl)
```bash
curl -X POST http://localhost:3000/api/chat -H 'Content-Type: application/json' -d '{"message": "수하물 상태를 알고 싶어요"}'
```

### 프론트엔드 사용
- 채팅 입력창에 질문 입력 → 에이전트가 자동 응답 및 위임
- 컨텍스트/툴/이벤트 패널에서 실시간 상태 확인

---

## 8. 예시

### 좌석 변경 요청
```
사용자: 비행기 좌석을 변경하고 싶어요
→ Seat Booking Agent로 handoff, "변경을 원하는 좌석 번호를 알려주세요." 응답
```

### 수하물 분실 신고
```
사용자: 수하물을 분실했어요
→ Baggage Agent로 handoff, "분실 수하물 설명과 연락처를 알려주세요." 응답
```

---

## 문의
- 시스템 구조, 확장, 커스터마이징 등 추가 문의는 소스코드 주석 및 각 파일 참고