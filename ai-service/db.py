import os
from collections import defaultdict
from decimal import Decimal

from sqlalchemy import bindparam, create_engine, text
from sqlalchemy.engine import URL

import config  # noqa: F401  (nạp .env)

_engine = create_engine(
    URL.create(
        "mysql+pymysql",
        username=os.getenv("DB_USERNAME"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_NAME"),
        query={"charset": "utf8mb4"},
    ),
    pool_pre_ping=True,
    pool_recycle=1800,
)

# Chỉ lấy phần ít thay đổi (tên, mô tả) để nhúng vào vector store
_SQL_DANH_MUC = text("""
    SELECT idloaica, tenloaica, mieuta
    FROM sanpham
    WHERE deleted = 0
    ORDER BY idloaica
""")

# Giá và tồn kho luôn đọc trực tiếp lúc trả lời. Giá hiện hành là dòng banggia có
# ngayketthuc IS NULL (giống BanggiaRepository phía Spring).
_SQL_THONG_TIN_HIEN_TAI = text("""
    SELECT sp.idloaica, sp.tenloaica, sp.mieuta, sz.sizeca,
           ct.soluongton, bg.giabanle, bg.giabansi
    FROM sanpham sp
    JOIN chitietsanpham ct ON ct.idloaica = sp.idloaica AND ct.deleted = 0
    JOIN sizeca sz ON sz.idsizeca = ct.idsizeca
    LEFT JOIN banggia bg ON bg.idchitietcaban = ct.idchitietcaban AND bg.ngayketthuc IS NULL
    WHERE sp.deleted = 0 AND sp.idloaica IN :ids
    ORDER BY sp.idloaica, sz.idsizeca
""").bindparams(bindparam("ids", expanding=True))


def lay_danh_muc_loai_ca():
    with _engine.connect() as conn:
        return conn.execute(_SQL_DANH_MUC).mappings().all()


def lay_thong_tin_hien_tai(ids):
    """Trả về {idloaica: {"ten", "mo_ta", "sizes"}} theo đúng thứ tự ids truyền vào."""
    if not ids:
        return {}
    with _engine.connect() as conn:
        rows = conn.execute(_SQL_THONG_TIN_HIEN_TAI, {"ids": list(ids)}).mappings().all()

    theo_loai = defaultdict(lambda: {"ten": None, "mo_ta": None, "sizes": []})
    for r in rows:
        muc = theo_loai[r["idloaica"]]
        muc["ten"] = r["tenloaica"]
        muc["mo_ta"] = (r["mieuta"] or "").strip()
        muc["sizes"].append({
            "size": r["sizeca"],
            "con_hang": (r["soluongton"] or Decimal(0)) > 0,
            "gia_le": r["giabanle"],
            "gia_si": r["giabansi"],
        })
    return {i: theo_loai[i] for i in ids if i in theo_loai}
