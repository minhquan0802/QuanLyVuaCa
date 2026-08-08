# Nghiệp vụ các trang quản trị và gợi ý phản biện

Tài liệu này mô tả **đúng theo hệ thống hiện tại**, dùng để trình bày ngắn gọn khi bảo vệ. Nguyên tắc trả lời hội đồng: nêu mục tiêu nghiệp vụ, lý do chọn cách làm, kiểm soát rủi ro, sau đó mới thừa nhận giới hạn và hướng mở rộng.

## 1. Quản lý loại cá

### Mục tiêu và luồng chính

- Quản lý danh mục loại cá, mô tả, hình ảnh và các kích cỡ bán được của từng loại.
- Mỗi cặp **loại cá – kích cỡ** là một mặt hàng kho riêng, có số kg tương ứng và bảng giá riêng. Cặp `(idloaica, idsizeca)` có ràng buộc unique ở DB; nếu cấu hình cũ đã bị xóa mềm, service khôi phục bản ghi đó thay vì tạo SKU trùng.
- Khi thêm loại cá có thể cấu hình đồng thời kích cỡ, kg quy đổi, giá lẻ và giá sỉ; tên loại cá và kích cỡ không được trùng.
- Có thể bổ sung/xóa kích cỡ khi mặt hàng chưa phát sinh tồn kho; không cho ngừng bán loại cá nếu vẫn còn tồn.
- “Ngừng bán” là xóa mềm: ẩn loại cá và các kích cỡ khỏi hoạt động bán, đồng thời kết thúc giá hiện hành nhưng vẫn giữ dữ liệu lịch sử.
- Khi mở bán lại, quản trị viên phải chọn lại kích cỡ, kg quy đổi và giá. Cấu hình mới không tự dùng lại giá cũ.

### Câu hỏi phản biện

**Tại sao không lưu tồn kho và giá ngay trong loại cá?**  
Một loại cá có nhiều kích cỡ, mỗi kích cỡ có lượng tồn, quy đổi kg và giá khác nhau. Tách cặp loại cá–kích cỡ giúp theo dõi và định giá đúng từng mặt hàng, tránh nhập nhằng dữ liệu.

**Tại sao không xóa hẳn loại cá?**  
Loại cá đã xuất hiện trong phiếu nhập, đơn hàng hoặc phiếu thanh lý là dữ liệu lịch sử. Xóa cứng có thể làm mất khả năng truy vết và phá liên kết; xóa mềm vừa ngừng kinh doanh vừa bảo toàn chứng từ.

**Tại sao còn tồn thì không cho ngừng bán?**  
Nếu ẩn mặt hàng khi còn tồn, hàng thực tế vẫn nằm trong kho nhưng không còn luồng bán hoặc xử lý rõ ràng. Hệ thống buộc bán hết hoặc thanh lý trước để tránh tồn “mồ côi”.

**Tại sao mở lại phải nhập giá mới?**  
Giá cũ chỉ đúng với giai đoạn kinh doanh trước. Yêu cầu cấu hình lại giúp quản trị viên xác nhận giá và quy đổi phù hợp với thị trường hiện tại.

**Khi quy đổi khối lượng, hệ số đơn vị hay số kg của chi tiết sản phẩm được ưu tiên?**  
Hệ thống ưu tiên `Donvitinh.hesokg` nếu khác null và lớn hơn 0; nếu đơn vị không có hệ số riêng mới dùng `Chitietcaban.sokgtuongung`. Nếu cả hai không hợp lệ thì báo lỗi. Công thức là `khối lượng = số lượng × hệ số quy đổi`, sau đó `thành tiền = khối lượng × giá bán/kg`. Ví dụ 3 bao × 10 kg/bao × 60.000 đồng/kg = 1.800.000 đồng.

## 2. Quản lý bảng giá

### Mục tiêu và luồng chính

- Quản lý giá bán lẻ và giá bán sỉ theo từng cặp loại cá–kích cỡ.
- Cả hai giá phải hợp lệ, lớn hơn mức tối thiểu của hệ thống và **giá sỉ không được cao hơn giá lẻ**.
- Tại một thời điểm, mỗi mặt hàng chỉ có một bảng giá hiện hành (`ngày kết thúc = null`).
- Khi đổi giá: giá cũ được đóng ngày kết thúc, sau đó tạo bản ghi giá mới. Nếu sửa nhiều lần trong cùng ngày, hệ thống cập nhật bản ghi của ngày đó để tránh sinh các khoảng giá vô nghĩa.
- Trang quản lý hiển thị cả giá đang áp dụng và lịch sử giá; không cho tạo giá cho mặt hàng đã ngừng bán.
- Khi nhập hàng, giá bán dự kiến được lưu tại chi tiết lô để làm dấu vết, đồng thời cập nhật bảng giá hiện hành nếu giá thay đổi.

### Câu hỏi phản biện

**Tại sao không ghi đè giá cũ?**  
Ghi đè sẽ không giải thích được đơn hàng trước đây đã dùng mức giá nào. Lưu theo thời gian giúp truy vết, đối soát và phân tích biến động giá.

**Tại sao giá thuộc loại cá–kích cỡ chứ không thuộc lô nhập?**  
Khách mua một mặt hàng theo loại và kích cỡ, không chọn lô nhập. Lô dùng để quản lý nguồn hàng và FIFO; bảng giá dùng để bán thống nhất. Hệ thống vẫn lưu giá tại thời điểm nhập để đối chiếu lịch sử.

**Tại sao giá sỉ phải nhỏ hơn hoặc bằng giá lẻ?**  
Đây là ràng buộc nghiệp vụ thông thường của chính sách bán số lượng lớn, đồng thời ngăn nhập nhầm hai trường giá.

**Tại sao không cho hẹn giá tương lai?**  
Phạm vi hiện tại ưu tiên giá có hiệu lực ngay để quy trình đơn giản và tránh hai giá cùng chờ áp dụng. Nếu có nhu cầu chiến dịch hoặc mùa vụ, có thể mở rộng ngày bắt đầu tương lai kèm kiểm tra khoảng thời gian không chồng lấn.

## 3. Quản lý kho hàng

### Mục tiêu và luồng chính

- Quản lý tồn tổng theo loại cá–kích cỡ và tồn chi tiết theo từng lô nhập.
- Phiếu nhập gồm nhà cung cấp, loại cá, ngày nhập, trạng thái thanh toán và nhiều dòng kích cỡ; số lượng và giá nhập phải lớn hơn 0.
- Mỗi dòng nhập tạo một lô có `số lượng còn lại = số lượng nhập`; tồn tổng của mặt hàng được cộng tương ứng.
- Ngày xử lý dự kiến của lô là ngày nhập + 2 ngày. Lô còn hàng quá ngưỡng 2 ngày được đưa vào cảnh báo để xem xét thanh lý.
- Khi xuất bán, hàng được phân bổ theo **FIFO** (lô nhập trước xuất trước). Cách này giảm nguy cơ cá lưu kho quá lâu.
- Admin và nhân viên được nhập hàng; chỉ admin được xác nhận phiếu nhập đã thanh toán. Nhân viên tạo phiếu thì mặc định chưa thanh toán.
- Màn hình kho hiển thị tồn, tình trạng đối soát, lô quá hạn và lịch sử phiếu nhập/chi tiết thanh toán.

### Câu hỏi phản biện

**Tại sao vừa lưu tồn tổng vừa lưu tồn theo lô?**  
Tồn tổng phục vụ kiểm tra nhanh khi bán; tồn theo lô phục vụ FIFO, tuổi hàng và truy xuất nguồn nhập. Hệ thống cập nhật cả hai trong cùng giao dịch và có kiểm tra đối soát để hạn chế lệch dữ liệu.

**Tại sao không chỉ tính tồn bằng tổng nhập trừ tổng xuất mỗi lần truy vấn?**  
Cách đó đúng về lý thuyết nhưng tốn chi phí khi dữ liệu lớn và khó phục vụ kiểm tra tồn theo thời gian thực. Lưu số dư giúp thao tác nhanh, còn chứng từ/lô vẫn là căn cứ kiểm tra lại.

**Tại sao dùng FIFO?**  
Cá là hàng có vòng đời ngắn. Xuất lô cũ trước giúp giảm hao hụt và phù hợp quản trị hàng tươi sống hơn LIFO.

**Tại sao nhân viên không được đánh dấu đã thanh toán?**  
Nhập kho và xác nhận chi tiền là hai trách nhiệm khác nhau. Phân quyền này giảm nguy cơ một người vừa lập vừa tự xác nhận giao dịch tài chính.

**Tại sao mốc quá hạn là 2 ngày?**  
Đây là tham số nghiệp vụ của mô hình cá tươi trong phạm vi đề tài. Nó được định nghĩa tập trung để dashboard, cảnh báo và thanh lý dùng cùng một tiêu chuẩn; khi triển khai thực tế nên cấu hình theo loại cá và điều kiện bảo quản.

**Lô quá hạn được xác định bằng field hạn sử dụng hay tính trực tiếp?**  
Hệ thống tính theo thời gian thực: lô còn hàng và ngày nhập đã cách hiện tại quá 2 ngày. Hằng số `SO_NGAY_QUA_HAN` được dùng chung cho dashboard, cảnh báo và thanh lý. Field `ngaythanhly = ngaynhap + 2 ngày` hiện có ghi nhưng chưa được đọc lại; cần thống nhất dùng field này làm mốc chính thức hoặc loại bỏ để tránh hai nguồn sự thật.

**FIFO có loại lô quá hạn khỏi luồng bán không?**  
Theo code hiện tại thì không. `DonhangService.truLoFifo` lấy mọi lô còn hàng của SKU, sắp theo ngày nhập tăng dần và trừ lô cũ trước. Nếu yêu cầu an toàn thực phẩm không cho bán lô quá hạn, cần đổi truy vấn xuất kho để loại lô đó hoặc chuyển sang FEFO kết hợp bước kiểm định.

## 4. Quản lý thanh lý

### Mục tiêu và luồng chính

- Hiển thị tất cả lô còn hàng, danh sách lô quá hạn và lịch sử phiếu thanh lý.
- Admin có thể chọn một hoặc nhiều lô, thanh lý một phần hoặc toàn bộ lượng còn lại.
- Có hai kết quả: **bán thanh lý** (đơn giá phải lớn hơn 0) và **tiêu hủy** (đơn giá bắt buộc bằng 0).
- Không cho thanh lý vượt lượng còn lại của lô hoặc vượt tồn tổng.
- Khi lập phiếu, hệ thống ghi người lập, thời điểm, lý do, ghi chú và chi tiết từng lô; đồng thời trừ tồn lô và tồn tổng trong một giao dịch. Lô hết hàng chuyển sang trạng thái đã thanh lý.
- Hệ thống chạy cảnh báo lô quá hạn hằng ngày và điều hướng admin đến đúng lô/tab cần xử lý.

### Câu hỏi phản biện

**Tại sao không tự động thanh lý hoặc tiêu hủy khi quá 2 ngày?**  
Tuổi lô chỉ là tín hiệu rủi ro, không đủ kết luận chất lượng thực tế. Quyết định bán giảm giá hay tiêu hủy ảnh hưởng tài chính và an toàn thực phẩm nên cần người có thẩm quyền kiểm tra, xác nhận.

Scheduler chạy hằng ngày chỉ gửi thông báo và liên kết đến lô/tab cần xử lý; không gọi service tạo phiếu và không tự trừ kho. Chỉ ADMIN thao tác `POST /Phieuthanhlys` mới tạo chứng từ thanh lý.

**Tại sao thanh lý theo lô chứ không theo tồn tổng?**  
Theo lô mới xác định được ngày nhập, giá vốn, lượng còn lại và nguồn gốc của hàng cần xử lý. Thanh lý tồn tổng sẽ mất khả năng truy xuất và dễ trừ nhầm lô.

**Tại sao tiêu hủy có đơn giá bằng 0?**  
Tiêu hủy không tạo doanh thu. Ép đơn giá bằng 0 giúp tách rõ hao hụt với bán thanh lý và làm số liệu dashboard chính xác.

**Phiếu thanh lý có workflow nhiều bước không?**  
Không. `DA_BAN_THANH_LY` và `DA_TIEU_HUY` đều là kết quả cuối cùng được chọn ngay lúc lập phiếu. Phiếu không có trạng thái chờ duyệt và không chuyển đổi qua lại sau khi lập.

**Tại sao không sửa hoặc xóa phiếu thanh lý sau khi lập?**  
Phiếu đã làm thay đổi tồn kho và là chứng từ truy vết. Cho sửa trực tiếp dễ làm sai lịch sử; hướng mở rộng đúng là nghiệp vụ phiếu điều chỉnh/hoàn tác có lưu vết, không xóa chứng từ cũ.

## 5. Quản lý tài khoản

### Mục tiêu và luồng chính

- Quản lý ba vai trò: `ADMIN`, `STAFF`, `CUSTOMER`; hỗ trợ tìm kiếm, lọc, thêm, sửa, duyệt, khóa và mở khóa.
- Tài khoản tự đăng ký đi qua vòng đời: `CHỜ XÁC THỰC EMAIL → CHỜ DUYỆT → HOẠT ĐỘNG`. Admin duyệt sau khi email đã được xác thực.
- Tài khoản do admin tạo được kích hoạt trực tiếp; tài khoản bị khóa không được đăng nhập.
- Mật khẩu được mã hóa; luồng quên mật khẩu dùng token và không cho đặt lại trùng mật khẩu cũ hoặc dùng mật khẩu đã xuất hiện trong dữ liệu rò rỉ.
- Chỉ admin được duyệt và thực hiện các thao tác quản trị tài khoản trên giao diện.

### Xác thực, phiên đăng nhập và bảo mật

- `POST /auth/token` kiểm tra email, mật khẩu và trạng thái tài khoản theo thứ tự chưa xác thực email, chờ duyệt, bị khóa. Nếu hợp lệ, hệ thống cấp access token và refresh token ký HMAC HS512.
- Token được lưu trong cookie `httpOnly`, không lưu trong `localStorage`. Bộ phân giải ưu tiên `Authorization: Bearer`, sau đó mới đọc cookie `token`.
- `POST /auth/refresh` dùng refresh-token rotation: refresh token cũ bị blacklist trong Redis theo `jti`, sau đó hệ thống phát cặp token mới nên token cũ không thể tái sử dụng.
- JWT chứa `password_version` được suy ra từ password hash. Khi người dùng đổi mật khẩu, token cũ không còn khớp và mất hiệu lực ngay giữa phiên.
- CSRF dùng `CookieCsrfTokenRepository`. Vì cookie `XSRF-TOKEN` là `httpOnly`, frontend gọi `GET /auth/csrf` để nhận token qua header `X-CSRF-TOKEN`, rồi gửi lại bằng `X-XSRF-TOKEN` cho request POST/PUT/PATCH/DELETE.
- `AuthRateLimitFilter` dùng Redis và Lua để giới hạn theo endpoint và IP: đăng nhập 10 lần/phút, refresh/logout 30 lần/phút, lấy CSRF 60 lần/phút. Khi Redis lỗi, cơ chế hiện tại fail-open để ưu tiên tính khả dụng; cần log và giám sát khi triển khai thật.
- Kiểm tra mật khẩu rò rỉ dùng Have I Been Pwned theo k-Anonymity: chỉ gửi 5 ký tự đầu của SHA-1, không gửi mật khẩu hoặc hash đầy đủ. Cơ chế dùng khi đăng ký, quên mật khẩu và đổi mật khẩu, đồng thời fail-open khi dịch vụ ngoài lỗi hoặc timeout.

### Câu hỏi phản biện

**Tại sao đã xác thực email vẫn phải chờ admin duyệt?**  
Xác thực email chỉ chứng minh người đăng ký sở hữu hộp thư; duyệt tài khoản xác nhận họ phù hợp với mô hình khách hàng của vựa. Hai bước giải quyết hai rủi ro khác nhau.

Tài khoản do admin tạo đi thẳng vào `HOAT_DONG`; tài khoản tự đăng ký đi qua `CHO_XAC_THUC_EMAIL → CHO_DUYET → HOAT_DONG`. Hệ thống hiện chưa có endpoint từ chối riêng cho tài khoản chờ duyệt; hướng mở rộng là thêm trạng thái và lý do từ chối thay vì duyệt rồi khóa hoặc xóa.

**Tại sao khóa thay vì xóa tài khoản?**  
Tài khoản liên kết với đơn hàng, công nợ và chứng từ. Khóa ngăn truy cập nhưng vẫn giữ danh tính người thực hiện và lịch sử giao dịch.

Khóa hiện dùng chung `PUT /tai-khoan/{id}` với `trangthaitk = KHOA`, không có endpoint khóa riêng. Do trạng thái tài khoản được kiểm tra lại khi xác minh JWT, tài khoản bị khóa mất quyền sử dụng token ngay giữa phiên. Cần phân biệt việc này với khóa đặt hàng do vượt hạn mức công nợ; hai cơ chế độc lập.

**Tại sao phải phân biệt admin và nhân viên?**  
Nhân viên xử lý vận hành hằng ngày; admin quản lý chính sách, giá, tài khoản, thanh lý và xác nhận tài chính. Nguyên tắc quyền tối thiểu làm giảm rủi ro thao tác sai hoặc lạm quyền.

**Lưu ý cần thống nhất khi bảo vệ:** trong hệ thống hiện tại, tài khoản `CUSTOMER` được hiểu là khách sỉ có tài khoản và được áp giá sỉ; khách lẻ là khách vãng lai/đơn bán lẻ. Nếu nghiệp vụ thực tế có cả khách lẻ đăng ký tài khoản, cần bổ sung trường `loại khách hàng` thay vì suy ra chính sách giá trực tiếp từ role.

## 6. Dashboard

### Mục tiêu và cách tính

- Cho admin nhìn nhanh hoạt động theo hôm nay, tuần, tháng, quý, năm hoặc khoảng ngày tùy chọn.
- Doanh thu đơn hàng chỉ tính các đơn **giao thành công** trong kỳ; đơn hủy hoặc đang xử lý không được tính.
- Chi phí nhập hàng là tổng giá trị các lô nhập trong kỳ, đồng thời tách phần đã thanh toán.
- Thu bán thanh lý chỉ lấy các phiếu bán thanh lý; tiêu hủy được thống kê thành hao hụt, không tạo doanh thu.
- Đơn hoàn thành là số đơn giao thành công trong kỳ. Số lô quá hạn là trạng thái kho hiện tại nên không phụ thuộc kỳ lọc.
- Bảng/biểu đồ luân chuyển theo loại cá gồm nhập, bán, bán thanh lý, tiêu hủy. Tồn kho là số thực tế hiện tại, không suy ra từ chênh lệch phát sinh trong kỳ.
- Danh sách đơn trong kỳ có phân trang và mở được chi tiết đơn.

### Câu hỏi phản biện

**Tại sao chỉ tính doanh thu khi giao thành công?**  
Đơn mới tạo, đang đóng hàng hoặc bị hủy chưa tạo ra doanh thu chắc chắn. Chỉ ghi nhận lúc giao thành công giúp KPI không bị phóng đại.

**Tại sao tồn kho không thay đổi theo bộ lọc thời gian?**  
Tồn kho là số dư tại thời điểm hiện tại, còn nhập–bán–thanh lý–tiêu hủy là phát sinh trong kỳ. Trộn hai khái niệm sẽ khiến người xem hiểu sai tồn lịch sử.

**Tại sao dashboard chưa hiển thị lợi nhuận?**  
Chi phí nhập trong kỳ không đồng nghĩa giá vốn của hàng đã bán trong kỳ; một phần hàng nhập vẫn còn tồn, và hàng bán có thể đến từ lô cũ. Vì vậy hệ thống không lấy doanh thu trừ toàn bộ tiền nhập rồi gọi là lợi nhuận. Muốn tính lợi nhuận chính xác cần tính giá vốn theo các lô FIFO đã xuất, cộng thêm chi phí vận chuyển, hao hụt và vận hành.

**Tại sao tách thu thanh lý khỏi doanh thu đơn hàng?**  
Doanh thu bán chính và thu hồi từ hàng cần xử lý có bản chất khác nhau. Tách riêng giúp đánh giá đúng hiệu quả bán hàng và mức độ hao hụt.

**Ví dụ phân biệt tổng đơn và đơn hoàn thành:**  
Trong dữ liệu demo tháng 07/2026, danh sách có 113 đơn thuộc mọi trạng thái nhưng dashboard chỉ ghi nhận 103 đơn giao thành công, tương ứng doanh thu 123.280.600 đồng. Điều này minh họa vì sao số đơn trong danh sách có thể lớn hơn KPI đơn hoàn thành.

## 7. Công thức trả lời khi hội đồng đề xuất cách khác

Dùng cấu trúc bốn ý sau, tránh trả lời “vì nhóm em thấy hợp lý”:

1. **Ghi nhận phương án:** “Cách thầy/cô nêu có thể áp dụng và có ưu điểm là…”
2. **Nêu bối cảnh:** “Trong phạm vi vựa cá tươi và dữ liệu hiện có, nhóm ưu tiên…”
3. **Nêu kiểm soát:** “Cách hiện tại bảo đảm… bằng ràng buộc/phân quyền/lưu lịch sử…”
4. **Nêu hướng mở rộng:** “Nếu triển khai thực tế ở quy mô lớn hơn, nhóm sẽ bổ sung…”

Mẫu trả lời ngắn:

> Phương án đó phù hợp khi có [điều kiện]. Trong phạm vi đề tài, nhóm chọn [cách hiện tại] vì ưu tiên [mục tiêu nghiệp vụ], đồng thời hệ thống kiểm soát bằng [ràng buộc cụ thể]. Nhóm nhận thức giới hạn là [giới hạn] và hướng mở rộng là [giải pháp], không cần phá vỡ dữ liệu hiện có.

## 8. Điểm cần nói thẳng hoặc hoàn thiện trước khi bảo vệ

- Không gọi `doanh thu − chi phí nhập trong kỳ` là **lợi nhuận**; muốn có lợi nhuận phải tính giá vốn hàng đã bán theo lô.
- Không khẳng định hàng quá 2 ngày chắc chắn hỏng; đây là **ngưỡng cảnh báo để kiểm tra và ra quyết định**.
- Không nói hệ thống tự thanh lý sau 2 ngày; scheduler chỉ gửi cảnh báo, còn việc bán thanh lý hoặc tiêu hủy do admin quyết định và tạo phiếu thủ công.
- Cần nói đúng rằng FIFO hiện vẫn có thể lấy lô quá hạn để xuất bán; nếu nghiệp vụ thực tế cấm bán thì phải bổ sung điều kiện loại lô hoặc quy trình kiểm định.
- `Chitietphieunhap.ngaythanhly` hiện được ghi nhưng chưa dùng làm nguồn xác định quá hạn; nên thống nhất một nguồn tính để tránh dữ liệu dư thừa.
- Rate limit và kiểm tra mật khẩu rò rỉ hiện fail-open khi Redis/dịch vụ ngoài lỗi. Đây là đánh đổi ưu tiên tính khả dụng, không phải bảo vệ tuyệt đối; triển khai thật cần log, cảnh báo và phương án dự phòng.
- Không khẳng định mọi `CUSTOMER` ngoài thực tế đều là khách sỉ; đó là quy ước hiện tại của đề tài và nên tách loại khách hàng khi mở rộng.
- API đăng ký công khai hiện nhận `vaitro` từ request. Backend nên **tự ép role thành `CUSTOMER`**, không tin dữ liệu role từ frontend; endpoint quản trị tạo tài khoản nên tách riêng và chỉ dành cho admin.
- API cập nhật tài khoản cần kiểm tra người dùng chỉ sửa đúng tài khoản của mình và không được tự đổi role/trạng thái; admin dùng DTO hoặc endpoint quản trị riêng.
- Giao diện đang dùng khóa/mở khóa để bảo toàn lịch sử, nhưng backend vẫn có API xóa tài khoản. Nên bỏ API xóa cứng hoặc chỉ cho xóa tài khoản chưa phát sinh liên kết; tài khoản đã giao dịch phải khóa.

Các điểm bảo mật trên là việc cần gia cố, không nên cố biện hộ là “do frontend đã ẩn nút”, vì client có thể bị bỏ qua và gọi API trực tiếp.
