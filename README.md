# Customer Service Agent with Dynamic Context Handoff

본 프로젝트는 **OpenAI Agent SDK for TypeScript**를 활용하여 다중 에이전트(multi-agent) 기반의 항공사 고객 서비스 시스템을 구현한 것입니다. 시스템의 아키텍처와 주요 기능은 다음과 같습니다.

**1. 다중 에이전트 및 위임(Handoff) 아키텍처:**
핵심 아키텍처는 **`Triage Agent`**를 중심으로 구성되어 있습니다. 이 에이전트는 사용자의 요청 의도를 파악하여 `Baggage`, `Seat Booking`, `FAQ` 등 고도로 전문화된 하위 에이전트에게 작업을 위임(Handoff)하는 허브 역할을 수행합니다. 각 전문 에이전트는 작업을 완료하거나 더 이상 처리할 수 없을 때 다시 `Triage Agent`에게 제어권을 넘겨, 유연하고 확장 가능한 대화 흐름을 만듭니다.

**2. 도구(Tools) 사용:**
각 에이전트는 특정 작업을 수행하기 위한 명확한 **`Tools`**를 보유하고 있습니다. 예를 들어, `flightStatusTool`, `reportLostBaggageTool` 등이 있으며, 각 도구의 파라미터는 `zod` 스키마를 통해 엄격하게 정의됩니다. 이를 통해 LLM은 필요한 정보를 정확히 요청하고 외부 함수를 안정적으로 호출할 수 있습니다.

**3. 컨텍스트(Context) 관리:**
대화의 상태와 데이터(예: 항공편 번호, 예약 번호)는 **`Context`** 객체를 통해 에이전트 간에 전달 및 유지됩니다. 특히 에이전트 위임 시 `onHandoff` 콜백 함수를 사용해 다음 에이전트가 필요로 하는 컨텍스트를 미리 준비하고 채워주는 고급 패턴을 사용합니다.

**4. 가드레일(Guardrails) 적용:**
시스템의 안정성과 예측 가능성을 위해 **`Guardrails`**가 적용되었습니다.

- **입력 가드레일 (Input Guardrail):** `Relevance Guardrail`은 사용자의 입력이 항공사 업무와 관련이 있는지 별도의 에이전트를 통해 판단하며, 관련 없는 질문일 경우 `TripwireTriggered`를 발생시켜 대화를 제어합니다.
- **출력 가드레일 (Output Guardrail):** `Content Length Guardrail`은 에이전트의 응답이 너무 길거나 짧지 않도록 길이를 제어합니다.


**5. 실행 및 시각화:**
전체 실행 흐름은 Next.js API Route (`/api/chat`) 내의 **`Runner`**가 관리하며, 사용자와의 상호작용, 에이전트 전환, 도구 호출 등 모든 과정은 **`Events`**로 기록됩니다. 프론트엔드는 이 데이터를 받아 '채팅 패널', '컨텍스트/도구 패널', '이벤트 로그 패널'의 3단 구조로 시각화하여 에이전트의 모든 작동 과정을 투명하게 보여줍니다.

이처럼 프로젝트는 OpenAI Agent SDK의 핵심 기능인 `Agent`, `Tool`, `Handoff`, `Guardrail`, `Runner`를 유기적으로 결합하여 복잡한 실제 시나리오를 해결하는 정교한 Agentic 서비스를 성공적으로 구축했습니다.