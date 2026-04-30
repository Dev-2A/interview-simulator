/**
 * LLM이 반환한 텍스트에서 JSON을 안전하게 추출·파싱한다.
 *
 * 처리하는 케이스:
 * 1. 정상 JSON 그대로 반환된 경우
 * 2. ```json ... ``` 마크다운 펜스로 감싸진 경우
 * 3. 앞뒤로 짧은 설명 텍스트가 붙은 경우
 *
 * @param {string} raw
 * @returns {any}
 * @throws {Error} 어떤 방법으로도 JSON 추출 실패 시
 */
export function parseLooseJson(raw) {
  if (typeof raw !== "string") {
    throw new Error("parseLooseJson: 입력이 문자열이 아닙니다.");
  }

  let text = raw.trim();

  // 1) 코드 펜스 제거
  // ```json\n{...}\n``` 또는 ```\n{...}\n```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // 2) 정상 파싱 시도
  try {
    return JSON.parse(text);
  } catch {
    // 3) 첫 { 부터 마지막 } 까지의 substring으로 한 번 더 시도
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const sliced = text.slice(start, end + 1);
      try {
        return JSON.parse(sliced);
      } catch (err2) {
        throw new Error(
          `JSON 파싱 실패: ${err2.message}\n원본:\n${raw.slice(0, 500)}`,
        );
      }
    }
    throw new Error(
      `JSON으로 보이는 부분을 찾지 못했어.\n원본:\n${raw.slice(0, 500)}`,
    );
  }
}
