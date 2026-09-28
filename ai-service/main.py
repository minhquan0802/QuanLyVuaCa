import logging
import re
import unicodedata

from fastapi import FastAPI
from langchain_chroma import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

from config import CHROMA_DIR, COLLECTION_NAME, GEMINI_MODEL, GOOGLE_API_KEY, get_embeddings
from db import lay_danh_muc_loai_ca, lay_thong_tin_hien_tai

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("ai-service")

app = FastAPI(title="Vua Ca AI Service")

# 1. Vector store chỉ chứa tên + mô tả cá (nạp bằng ingest.py)
vector_store = Chroma(
    collection_name=COLLECTION_NAME,
    embedding_function=get_embeddings(),
    persist_directory=CHROMA_DIR,
)
retriever = vector_store.as_retriever(search_kwargs={"k": 4})
SO_LOAI_CA_TOI_DA = 6

# 2. LLM
llm = ChatGoogleGenerativeAI(
    model=GEMINI_MODEL,
    temperature=0.3,
    google_api_key=GOOGLE_API_KEY,
)

# 3. Prompt
prompt = PromptTemplate.from_template("""Bạn là trợ lý ảo nhiệt tình của vựa cá.
Chỉ dùng thông tin bên dưới để trả lời câu hỏi của khách. Giá và tình trạng hàng là số liệu hiện tại.
Nếu không có thông tin phù hợp, hãy nói thật là vựa hiện chưa có dữ liệu và gợi ý khách liên hệ hotline của vựa, không được tự bịa câu trả lời.

Thông tin sản phẩm:
{context}

Câu hỏi của khách: {question}

Câu trả lời:""")


def _dinh_dang_gia(gia):
    return f"{gia:,.0f}".replace(",", ".") + " đ" if gia is not None else "chưa có giá"


def _bo_dau(chuoi: str) -> str:
    chuoi = unicodedata.normalize("NFD", chuoi.lower().replace("đ", "d"))
    return "".join(c for c in chuoi if unicodedata.category(c) != "Mn")


def _tim_theo_ten(question: str) -> list[int]:
    """Tìm kiếm ngữ nghĩa bắt tên riêng kém ("Cá lóc giá bao nhiêu?" không ra Cá Lóc),
    nên khớp trực tiếp tên cá trong câu hỏi, không phân biệt dấu."""
    cau_hoi = _bo_dau(question)
    ids = []
    for row in lay_danh_muc_loai_ca():
        ten = re.sub(r"^ca\s+", "", _bo_dau(row["tenloaica"]))
        if ten and re.search(rf"\b{re.escape(ten)}\b", cau_hoi):
            ids.append(row["idloaica"])
    return ids


def tao_context(question: str) -> str:
    docs = retriever.invoke(question)

    # Cá được nhắc tên đứng trước, sau đó theo độ liên quan; bỏ trùng
    ids = list(dict.fromkeys(
        _tim_theo_ten(question) + [d.metadata["idloaica"] for d in docs]
    ))[:SO_LOAI_CA_TOI_DA]
    # Loại cá ngừng bán sau lần ingest gần nhất hoặc chưa cấu hình size sẽ không có trong kết quả
    thong_tin = lay_thong_tin_hien_tai(ids)

    doan = []
    for hien_tai in thong_tin.values():
        dong_size = [
            f"- {s['size']}: giá lẻ {_dinh_dang_gia(s['gia_le'])}, "
            f"giá sỉ {_dinh_dang_gia(s['gia_si'])}, "
            f"{'còn hàng' if s['con_hang'] else 'hết hàng'}"
            for s in hien_tai["sizes"]
        ]
        doan.append(
            f"Tên cá: {hien_tai['ten']}. Mô tả: {hien_tai['mo_ta'] or 'chưa có mô tả'}\n"
            + "\n".join(dong_size)
        )

    return "\n\n".join(doan) if doan else "Không tìm thấy sản phẩm phù hợp."


# 4. Chuỗi RAG: tìm tên/mô tả trong Chroma, rồi ghép giá + tồn kho đọc trực tiếp từ MySQL
rag_chain = (
    {"context": RunnableLambda(tao_context), "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


# Hàm đồng bộ để FastAPI chạy trong threadpool, không chặn event loop khi gọi DB/LLM
@app.post("/ai/chat")
def chat_endpoint(request: ChatRequest):
    try:
        reply = rag_chain.invoke(request.message)
        return {"success": True, "reply": reply}
    except Exception:
        log.exception("Lỗi khi trả lời câu hỏi")
        return {"success": False, "error": "Không thể xử lý câu hỏi lúc này"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
