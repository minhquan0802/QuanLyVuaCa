# Sinh mã VietQR — đặc tả kỹ thuật

> Dùng cho FR-TT-* trong [`DAC-TA.md`](./DAC-TA.md).

## 0. Cách project hiện tại đang làm, và vì sao phải đổi

Nhánh `NewFE` đã có sẵn VietQR ở `client/src/pages/admin/TaoDonHang.jsx`. **Luồng thao tác giữ nguyên**, chỉ đổi cách lấy ảnh QR.

### Luồng hiện có — giữ nguyên toàn bộ

```
Bấm "Tạo đơn hàng"
   │
   ├── Khách SỈ  ──> tạo đơn ngay, khách thanh toán sau,
   │                 đơn chuyển sang "Đang đóng hàng"
   │
   └── Khách LẺ  ──> paymentStep = "choose"
                        ├── [Tiền mặt] ──────────────> submitOrder()
                        └── [Quét QR] ──> paymentStep = "qr"
                                             ├── [Quay lại]
                                             └── [Đã nhận tiền, hoàn tất] ──> submitOrder()
```

Điểm cốt lõi của luồng này — **đơn chỉ được ghi nhận sau khi nhân viên xác nhận đã thật sự nhận được tiền**, không phải lúc hiện QR — là đúng nghiệp vụ và giữ nguyên không sửa.

### Cách lấy ảnh QR hiện tại

```js
const BANK_ID      = import.meta.env.VITE_BANK_ID      || "MB";
const BANK_ACCOUNT = import.meta.env.VITE_BANK_ACCOUNT || "0123456789";
const BANK_NAME    = import.meta.env.VITE_BANK_NAME    || "SHOP VUA CA";

const getVietQrUrl = (amount) => {
    const info = encodeURIComponent("TT DON HANG POS");
    return `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACCOUNT}-compact2.png`
         + `?amount=${amount}&addInfo=${info}&accountName=${encodeURIComponent(BANK_NAME)}`;
};
```

### Ba vấn đề phải xử lý

| # | Vấn đề | Hệ quả |
|---|---|---|
| 1 | **`img.vietqr.io` là API trực tuyến** | Mất Internet là ô ảnh QR trắng trơn. Xung đột trực tiếp với PC-02 (mất mạng vẫn bán được). Đây là lý do bắt buộc phải sinh QR cục bộ. |
| 2 | **`addInfo` cố định `"TT DON HANG POS"`** | Mọi đơn có cùng nội dung chuyển khoản. Cuối ngày nhìn sao kê ngân hàng không biết khoản nào ứng với đơn nào. Phải đổi thành mã đơn. |
| 3 | **Thông tin ngân hàng nằm trong biến môi trường** | Đổi tài khoản phải build lại ứng dụng. Yêu cầu mới là sửa được ngay trong phần mềm, nên phải chuyển vào CSDL (bảng `cau_hinh_qr`). |

### Phương án

Giữ nguyên giao diện và luồng, thay hàm lấy ảnh:

```ts
// Thay cho getVietQrUrl(amount)
function anhQR(donHang: DonHang, cauHinh: CauHinhQR): string {
  const payload = taoPayloadVietQR({
    binNganHang: cauHinh.binNganHang,      // '970422' cho MB
    soTaiKhoan:  cauHinh.soTaiKhoan,
    soTien:      donHang.tongTien,
    noiDung:     donHang.maDon,            // 'POS01 20260909 0007'
  });
  return veQRThanhDataURL(payload);        // thư viện qrcode, chạy cục bộ
}
```

Sinh cục bộ chạy được **cả khi online lẫn offline**, nên không có lý do gì giữ lời gọi API. Ảnh QR ra tương đương, khách quét bằng ứng dụng ngân hàng như cũ.

Lưu ý: `VITE_BANK_ID` hiện là **mã ngân hàng** (`"MB"`), còn sinh cục bộ cần **mã BIN 6 chữ số** (`970422`). Bảng `cau_hinh_qr` phải lưu BIN.

---

Phần còn lại của tài liệu này mô tả cách sinh chuỗi VietQR cục bộ. Chuỗi QR chỉ là một chuỗi văn bản theo chuẩn EMVCo cộng mã kiểm tra CRC — **không cần API, không cần Internet**.

## 1. Cấu trúc TLV

Toàn bộ chuỗi là các bộ ba **Tag (2 chữ số) — Length (2 chữ số) — Value**, nối liền nhau, không dấu phân cách. Vì độ dài chỉ có 2 chữ số nên **mỗi trường tối đa 99 ký tự**.

```
tlv("58", "VN")  ->  "5802VN"
                      ││ ││ └── giá trị
                      ││ └──── độ dài = 2
                      └────── tag 58
```

Các tag phải xếp theo **thứ tự tăng dần**.

| Tag | Tên | Giá trị dùng cho vựa cá | Bắt buộc |
|---|---|---|---|
| `00` | Payload Format Indicator | `01` | Có |
| `01` | Point of Initiation Method | `11` = QR tĩnh (khách tự nhập tiền)<br>`12` = QR động (có sẵn số tiền) | Có |
| `38` | Merchant Account Information | Template lồng, xem §2 | Có |
| `53` | Transaction Currency | `704` (VND, ISO 4217) | Có |
| `54` | Transaction Amount | Số nguyên đồng, ví dụ `1234500`. **Chỉ có ở QR động** | Không |
| `58` | Country Code | `VN` | Có |
| `62` | Additional Data | Template lồng, chứa nội dung chuyển khoản | Không |
| `63` | CRC | 4 ký tự hex viết hoa, xem §3 | Có |

Tag `52` (mã ngành), `59` (tên đơn vị), `60` (thành phố) theo EMVCo là bắt buộc, nhưng **QR chuyển khoản VietQR trong thực tế bỏ qua ba tag này** và các ứng dụng ngân hàng vẫn đọc bình thường. Xem cảnh báo ở §6.

## 2. Trường 38 — thông tin người nhận

Đây là chỗ dễ làm sai nhất. Sub-tag `01` **là một template lồng bên trong**, không phải mã ngân hàng đặt trực tiếp.

```
38  (độ dài)
├── 00  10  "A000000727"          định danh NAPAS, luôn cố định
├── 01  (độ dài)                  ← TEMPLATE LỒNG
│   ├── 00  06  "970436"          mã BIN ngân hàng, 6 chữ số
│   └── 01  (độ dài)  "0881000458086"   số tài khoản
└── 02  08  "QRIBFTTA"            chuyển tới TÀI KHOẢN
                                  ("QRIBFTTC" nếu chuyển tới THẺ)
```

### Ví dụ đã giải mã

Chuỗi thật, tài khoản Vietcombank:

```
0010A00000072701270006970436011308810004580860208QRIBFTTA
```

Tách ra:

| Đoạn | Nghĩa |
|---|---|
| `00` `10` `A000000727` | GUID NAPAS |
| `01` `27` `...` | template lồng, dài 27 ký tự |
| &nbsp;&nbsp;`00` `06` `970436` | BIN Vietcombank |
| &nbsp;&nbsp;`01` `13` `0881000458086` | số tài khoản 13 chữ số |
| `02` `08` `QRIBFTTA` | chuyển tới tài khoản |

Tổng độ dài phần giá trị = 14 + 31 + 12 = **57** → trường đầy đủ mở đầu bằng `3857`.

### Mã BIN một số ngân hàng

| Ngân hàng | BIN |
|---|---|
| Vietcombank | `970436` |
| VietinBank | `970415` |
| BIDV | `970418` |
| Agribank | `970405` |
| Techcombank | `970407` |
| MB Bank | `970422` |
| ACB | `970416` |
| Sacombank | `970403` |
| VPBank | `970432` |
| TPBank | `970423` |

Danh sách đầy đủ nên nhập vào bảng danh mục trong CSDL thay vì viết cứng, vì thỉnh thoảng có ngân hàng mới.

## 3. CRC — mã kiểm tra

- Thuật toán: **CRC-16/CCITT-FALSE**
- Đa thức `0x1021`, giá trị khởi tạo `0xFFFF`
- Không đảo bit đầu vào, không đảo bit đầu ra, không XOR cuối
- Tính trên **toàn bộ chuỗi, bao gồm cả bốn ký tự `6304` ở cuối**
- Kết quả in ra 4 ký tự hex **viết hoa**, đệm số 0 nếu thiếu

Sai một trong các chi tiết trên là điện thoại quét ra "mã QR không hợp lệ".

## 4. Mã nguồn tham chiếu

```ts
/** CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF, không đảo bit, không XOR cuối */
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Một bộ Tag-Length-Value. Giá trị dài quá 99 ký tự là sai chuẩn. */
function tlv(tag: string, value: string): string {
  if (value.length > 99) throw new Error(`Trường ${tag} dài quá 99 ký tự`);
  return tag + String(value.length).padStart(2, '0') + value;
}

export interface ThamSoQR {
  binNganHang: string;   // '970436'
  soTaiKhoan: string;    // '0881000458086'
  soTien?: number;       // đồng, số nguyên. Bỏ trống -> QR tĩnh
  noiDung?: string;      // 'POS01 20260909 0007'
}

export function taoPayloadVietQR(t: ThamSoQR): string {
  const nguoiNhan = tlv('00', t.binNganHang) + tlv('01', t.soTaiKhoan);

  const thongTinNhan =
    tlv('00', 'A000000727') +
    tlv('01', nguoiNhan) +
    tlv('02', 'QRIBFTTA');

  const qrDong = t.soTien != null && t.soTien > 0;

  let payload =
    tlv('00', '01') +
    tlv('01', qrDong ? '12' : '11') +
    tlv('38', thongTinNhan) +
    tlv('53', '704') +
    (qrDong ? tlv('54', String(Math.round(t.soTien!))) : '') +
    tlv('58', 'VN') +
    (t.noiDung ? tlv('62', tlv('08', chuanHoaNoiDung(t.noiDung))) : '');

  payload += '6304';           // tag + length của CRC, tính vào phần băm
  return payload + crc16(payload);
}

/** Bỏ dấu, viết hoa, chỉ giữ A-Z 0-9 và khoảng trắng, cắt còn 25 ký tự. */
function chuanHoaNoiDung(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .trim()
    .slice(0, 25);
}
```

Chuỗi trả về đem vẽ thành ảnh bằng thư viện QR bất kỳ (`qrcode` trên npm), mức sửa lỗi **M**, cỡ tối thiểu 250×250 px để điện thoại quét được từ màn hình.

## 5. QR tĩnh và QR động

| | QR tĩnh | QR động |
|---|---|---|
| Tag `01` | `11` | `12` |
| Có số tiền | Không | Có |
| Sinh khi nào | Một lần, lưu sẵn trong cấu hình | Mỗi đơn |
| Cách dùng | In ra dán ở quầy | Hiện trên màn hình / in lên phiếu |
| Khách phải làm gì | Tự nhập số tiền và nội dung | Chỉ bấm xác nhận |
| Đối soát | Khó — dễ nhập sai tiền, thiếu nội dung | Dễ — nội dung là mã đơn |

Hệ thống hỗ trợ **cả hai**. Mã đơn nằm ở nội dung chuyển khoản của QR động là thứ giúp đối chiếu sổ sách cuối ngày.

## 6. Cảnh báo thực tế — đọc trước khi đưa vào dùng

**1. Không có cách nào tự biết khách đã chuyển tiền.** Chuỗi QR chỉ là chỉ dẫn cho ứng dụng ngân hàng của khách. Muốn hệ thống tự biết tiền đã về thì phải tích hợp dịch vụ đọc biến động số dư (SePay, Casso...) — nằm ngoài phạm vi bản này và **bắt buộc phải có Internet**.

Vì vậy quy trình là: hiện QR → khách chuyển → khách đưa màn hình cho nhân viên xem → **nhân viên tự bấm xác nhận đã nhận tiền**. Hệ thống ghi lại ai xác nhận và lúc nào. Đây là điểm dễ bị gian lận nhất, phải có nhật ký.

**2. Bắt buộc thử với ứng dụng ngân hàng thật trước khi chạy.** Vì đặc tả bỏ qua ba tag mà EMVCo coi là bắt buộc (`52`, `59`, `60`), phải quét thử bằng ít nhất ba ứng dụng khác nhau (Vietcombank, MB, Momo) trước khi đưa ra quầy. Nếu ứng dụng nào từ chối thì bổ sung:

```
tlv('52', '5812') +               // mã ngành: nhà hàng / thực phẩm
tlv('59', 'VUA CA DIEU HONG') +   // tên, không dấu, tối đa 25 ký tự
tlv('60', 'CAN THO')              // thành phố, không dấu, tối đa 15 ký tự
```

chèn đúng thứ tự tăng dần: `52` trước `53`, còn `59` và `60` sau `58`.

**3. Nội dung chuyển khoản phải không dấu.** Nhiều ngân hàng cắt hoặc từ chối ký tự có dấu và ký tự đặc biệt. Hàm `chuanHoaNoiDung` ở trên xử lý việc này, giới hạn 25 ký tự cho an toàn.

**4. Đổi tài khoản nhận không được sửa đè.** Khi chủ vựa đổi sang tài khoản khác, phải tạo bản ghi cấu hình mới và đánh dấu bản cũ ngừng dùng. Đơn cũ vẫn trỏ tới cấu hình cũ, nếu không thì tra lại sổ sách năm ngoái sẽ ra sai tài khoản.

## Nguồn

- [vietqr-parser (Go) — chuỗi payload thật dùng để giải mã đối chiếu](https://github.com/thanhtinhpas1/vietqr-parser)
- [vietqr-ts — cấu trúc trường theo chuẩn NAPAS IBFT](https://github.com/binhnguyenduc/vietqr-ts)
- [EMV QR Payload Format — bảng tag EMVCo merchant-presented](https://emvqrhub.com/learn/emv-qr-payload-format/)
- [emv_qr_builder — thư viện sinh QR ngoại tuyến](https://pub.dev/packages/emv_qr_builder)
