import sys

from langchain_chroma import Chroma
from langchain_core.documents import Document

from config import CHROMA_DIR, COLLECTION_NAME, get_embeddings
from db import lay_danh_muc_loai_ca


def tao_documents():
    documents = []
    for row in lay_danh_muc_loai_ca():
        mo_ta = (row["mieuta"] or "").strip()
        documents.append(Document(
            page_content=f"Tên cá: {row['tenloaica']}. Mô tả: {mo_ta or 'chưa có mô tả'}",
            metadata={"idloaica": row["idloaica"]},
        ))
    return documents


def build_vector_db():
    documents = tao_documents()
    print(f"Đọc được {len(documents)} loại cá đang bán từ database.")

    print("Đang tải mô hình embedding local...")
    vector_store = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=get_embeddings(),
        persist_directory=CHROMA_DIR,
    )

    # Xóa dữ liệu cũ để loại cá đã ngừng bán không còn xuất hiện trong kết quả tìm kiếm
    vector_store.reset_collection()
    if documents:
        vector_store.add_documents(
            documents, ids=[str(d.metadata["idloaica"]) for d in documents]
        )
    print("Hoàn tất nạp dữ liệu!")


if __name__ == "__main__":
    # Console Windows mặc định không in được tiếng Việt có dấu
    sys.stdout.reconfigure(encoding="utf-8")
    build_vector_db()
