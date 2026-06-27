import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { transcript, customApiKey } = await request.json();
    
    // Choose API key: custom key passed from client, or server-side env variable
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Gemini API Key. Vui lòng nhập API Key trong phần Cài đặt." },
        { status: 400 }
      );
    }

    // Validate transcript length to prevent abuse
    if (!transcript || typeof transcript !== "string" || transcript.length > 500) {
      return NextResponse.json(
        { error: "Câu nói không hợp lệ hoặc quá dài." },
        { status: 400 }
      );
    }

    const systemInstruction = `Bạn là bộ phận xử lý ngôn ngữ tự nhiên (NLU) cho ứng dụng "EasyMove" dành cho người cao tuổi.
Nhiệm vụ của bạn là phân tích câu nói Tiếng Việt của người già và trích xuất thông tin dưới dạng JSON.

Hãy phân tích và trả về một đối tượng JSON duy nhất với cấu trúc sau:
{
  "intent": "BOOK_RIDE" hoặc "ORDER_FOOD" hoặc "BUY_ITEMS" hoặc "UNKNOWN",
  "destination": "Địa điểm đến rõ ràng bằng Tiếng Việt (hoặc rỗng nếu không có)",
  "items": "Tên món ăn hoặc món hàng muốn mua hộ (nếu intent là ORDER_FOOD hoặc BUY_ITEMS, ngược lại để rỗng)",
  "vietnamesePrompt": "Câu phản hồi ngắn gọn, tự nhiên, lễ phép bằng Tiếng Việt để AI đọc to cho người già nghe. Ví dụ: 'Dạ, đặt xe đi Bệnh viện Chợ Rẫy đúng không ạ?' hoặc 'Dạ, đặt mua một hộp cơm tấm sườn đúng không ạ?'"
}

Chú ý:
- Nếu người già nói "đi bệnh viện", "về nhà", "chợ", hãy điền tương ứng.
- Trả về DUY NHẤT một chuỗi JSON hợp lệ.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: transcript }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || "Lỗi kết nối Gemini API." },
        { status: response.status }
      );
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      return NextResponse.json({ error: "Không nhận được phản hồi từ mô hình." }, { status: 500 });
    }

    const parsedJson = JSON.parse(responseText.trim());
    return NextResponse.json(parsedJson);

  } catch (error: any) {
    console.error("Gemini parse error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi xử lý ngôn ngữ." },
      { status: 500 }
    );
  }
}
