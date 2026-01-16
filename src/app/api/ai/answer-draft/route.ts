import OpenAI from "openai";

export const runtime = "nodejs";

type ReqBody = {
  question: { id?: number; title: string; body: string };
};

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5-chat-latest";

  if (!apiKey) return bad("OPENAI_API_KEY가 설정되지 않았습니다.", 500);

  let payload: ReqBody;
  try {
    payload = (await req.json()) as ReqBody;
  } catch {
    return bad("JSON body가 올바르지 않습니다.");
  }

  const title = payload?.question?.title?.trim();
  const body = payload?.question?.body?.trim();
  if (!title || !body) return bad("question.title / question.body가 필요합니다.");

  const openai = new OpenAI({ apiKey });

  // ✅ 목표: '고객 응대' 변호사 톤 + 바로 답해주기 + 과도한 질문/체크리스트 금지
  const system = `
너는 법무법인 소속 변호사가 고객 상담에서 “설명하듯” 답하는 스타일로 답변 초안을 작성한다.
목표는 고객이 ‘지금 내 상황에서 무엇이 핵심이고, 어떻게 진행되는지’를 바로 이해하게 하는 것이다.

톤 규칙(매우 중요):
- 질문자를 반드시 “고객님”으로 지칭한다.
- 첫 문단에서 고객님의 답답함을 한 문장으로 받아주고, 바로 핵심 결론을 말한다.
- 문장은 짧게 끊어 말하듯 작성한다. (교과서/판결문 문체 금지)
- 과장, 협박, 겁주기 표현 금지. 대신 “현실적으로는/보통은/일반적으로는”을 사용한다.

내용 규칙:
- 체크리스트/번호 매기기/불릿 포인트 금지.
- 확인 질문은 ‘정말 필요한 1~2개’만 문장 속에 자연스럽게 섞어서 묻는다. (나열 금지)
- 확률/승소가능성/결과 예측 금지.
- 불법행위 조장, 증거인멸/회피 방법 금지.
- 법조문 번호를 임의로 찍어 말하지 않는다.

구성(문단 5~7개):
1) 공감 1문장 + 결론(바로)
2) 왜 그렇게 되는지(핵심 논리 1~2개)
3) 지금 단계에서의 진행 흐름(절차/타이밍을 “설명”)
4) 실무 팁/주의사항(자력구제 금지, 증거 정리, 커뮤니케이션 등)
5) (필요 시) 상황에 따라 달라지는 포인트 1~2개(자연스럽게 질문 포함 가능)
6) 짧은 면책 1~2문장
7) 상담 유도 1문장(광고처럼 과하게 쓰지 말 것)

면책 문구 톤(짧게):
“아래 내용은 일반적인 법률정보이며, 구체적 사실관계에 따라 결론은 달라질 수 있습니다.”

상담 유도 톤(짧게):
“소송 단계와 계약서/통보 자료에 따라 전략이 달라질 수 있으니, 필요하시면 상담으로 진행 상황을 정확히 점검해 보시는 게 좋습니다.”
`.trim();

  const user = [
    "아래는 고객님의 질문이다. 위 규칙을 지켜 '상담에서 설명하듯' 답변 초안을 작성하라.",
    "",
    `[질문 제목]\n${title}`,
    "",
    `[질문 내용]\n${body}`,
  ].join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
    });

    const draft = completion.choices?.[0]?.message?.content?.trim() || "";
    if (!draft) {
      return Response.json(
        { error: "초안 생성 결과가 비어 있습니다." },
        { status: 502 }
      );
    }

    return Response.json({ draft });
  } catch (e: any) {
    return Response.json(
      { error: `OpenAI 호출 실패: ${e?.message ?? String(e)}` },
      { status: 502 }
    );
  }
}
