** quy trình 1:  login lần đầu
1. mở app - load thông tin local storage lên store.
2. kiểm tra store thấy chưa có thông tin gì do mở app lần đầu, chuyển sang login page
3. thực hiện skip login -> tạo anon id và lưu vào auth store - persist sang local storage.
4. Thực hiện login thành công -> lưu user id vào auth store - lưu auth data vào auth store  - persist sang local storage - kiểm tra currency nếu chưa có thì sang onboard, nếu có rồi thì vào home page
5. sau khi login xong thì chuyển sang trang onboarding, các step onboarding thực hiện cập nhật các giá trị language, theme mode, currency vào auth store - persist sang local storage - lưu trên cloud nếu online, tạo queue đợi lưu sau nếu offline. cập nhật list default categories - lưu cloud nếu online, tạo queue lưu sau nếu offline - cập nhật vào store và persist sang local.
6. sau onboarding thì chuyển sang home page.

** quy trình 2:  login lấn sau với anonymous mode
1. mở app - load thông tin local storage lên store
2.  kiểm tra store thấy có anon id
3. kiểm tra tiếp auth store xem đã có currency chưa?. Nếu có đẩy sang home page, nếu chưa đẩy sang onboarding page để chạy lại onboarding
4. chạy onboarding như quy trình 1

** quy trình 3: login lần 2 với google account login
1. mở app - load thông tin local storage lên store
2. kiểm tra thấy user id
3. dùng user id (token - refresh token,...) gọi api lấy thông tin auth cập nhật vào store - persist lại sang local storage
4. nếu gọi lấy auth thành công thì kiểm tra xem có currency chưa, nếu chưa có vào onboarding lại, nếu có rồi thì vào home page
5. nếu gọi auth failed thì thực hiện logout - xóa hết local data và redirect ra signin lại.

** quy trình 4: chuyển từ anon mode sang login bằng cách chọn signin trong setting.
1. nhấn signin thì redirect sang login page mà không xóa local data 
2. nếu user nhấn skip login thì vào lại home page 
3. nếu user login thành công bằng 1 google account thì tiếp tục kiểm tra thông tin user vừa trả về
4. nếu user vừa trả về chưa có currency thì thực hiện nạp data local lên cho user mới và redirect sang home page
5. nếu user đã có currency rồi thì hiện popup hỏi user là nếu tiếp tục đăng nhập sẽ xóa hết local data trong chế độ ẩn danh trước đó vì tài khoản đã tồn tại trên cloud.
6. nếu user chọn đồng ý thì xóa local data và đăng nhập với user mới
7. nếu user cancel thì đóng popup để user có thể login lại account khác hoặc chọn skip login

** quy trình 5: User đã đăng nhập chọn đăng xuất
1. khi user đăng xuất kiểm tra nếu có local data chưa sync lên cloud thì hiện thông báo, nếu đăng xuất sẽ mất data chưa đồng bộ, nếu user xác nhận mất thì mới logout.
2. kiểm tra không thấy data chưa đồng bộ (queue không có item nào) thì xóa toàn bộ local data và logout.
