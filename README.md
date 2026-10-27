# TrelloClone

Một nền tảng quản lý dự án và cộng tác nhóm đầy đủ tính năng, lấy cảm hứng từ Trello, được xây dựng bằng Next.js, TypeScript, Prisma và MySQL. Ứng dụng được thiết kế để giúp cá nhân và nhóm sắp xếp công việc, quản lý không gian làm việc (workspace), theo dõi mức độ ưu tiên và cộng tác trong một quy trình Kanban gọn gàng, linh hoạt.

Dự án này không chỉ là một bản sao của một công cụ năng suất quen thuộc — nó là một ứng dụng hướng sản phẩm thực tế, thể hiện cách triển khai full-stack hiện đại, xác thực an toàn, quản lý bảng và thẻ, kiểm soát truy cập theo vai trò, và kiến trúc có khả năng mở rộng cho việc sử dụng thực tế.

> Chỗ dành cho ảnh xem trước dự án hoặc ảnh chụp giao diện: phần này được cố ý để trống để cập nhật sau cho portfolio/demo.

## Vì sao dự án này quan trọng

TrelloClone được xây dựng để giải quyết những vấn đề quy trình làm việc thực tế mà các nhóm và cá nhân gặp phải hằng ngày:

- Công việc trở nên lộn xộn khi các tác vụ nằm rải rác trong ghi chú, tin nhắn và bảng tính.
- Cộng tác nhóm khó khăn hơn khi mỗi người dùng một công cụ khác nhau và không có một nguồn thông tin duy nhất.
- Việc theo dõi tiến độ, hạn chót, trách nhiệm và các vướng mắc thường kém hiệu quả.
- Lập kế hoạch năng suất đòi hỏi một quy trình trực quan, dễ hiểu và dễ quản lý.

Dự án này cung cấp cho người dùng một hệ thống có cấu trúc để:

- tổ chức công việc thành bảng (board), danh sách (list) và thẻ (card);
- hình dung rõ ràng trạng thái và mức độ ưu tiên;
- phân công quyền sở hữu và trách nhiệm;
- cải thiện giao tiếp thông qua bình luận và theo dõi hoạt động;
- giảm việc phải chuyển đổi qua lại giữa các công cụ;
- hỗ trợ cả quy trình làm việc cá nhân lẫn nhóm.

Xét từ góc độ portfolio, dự án này thể hiện:

- kiến trúc full-stack theo chuẩn production;
- các mẫu xác thực và phân quyền an toàn;
- mô hình hóa cơ sở dữ liệu và thiết kế quan hệ;
- phát triển React + Next.js hiện đại; và
- các quyết định UX thực tiễn cho quy trình nghiệp vụ thực tế.

---

## Tổng quan dự án

TrelloClone là một ứng dụng quản lý dự án theo phong cách Kanban, nơi người dùng có thể tạo workspace, thêm bảng, quản lý danh sách và sắp xếp thẻ bằng thao tác kéo thả. Ứng dụng mô phỏng quy trình Trello quen thuộc, đồng thời bổ sung logic tùy chỉnh và các mẫu kiến trúc phù hợp với một ứng dụng web kiểu SaaS hiện đại.

Sản phẩm hướng đến:

- quản lý công việc cá nhân;
- lập kế hoạch dự án nhóm;
- lập kế hoạch sprint và theo dõi tiến độ;
- quy trình sản phẩm và marketing;
- lập kế hoạch nội dung và theo dõi chiến dịch;
- vận hành nội bộ và triển khai dự án của nhóm.

Ứng dụng phân tách rõ ràng giữa các tính năng sản phẩm và kiến trúc kỹ thuật, nhờ đó trở thành một ví dụ tốt về thiết kế phần mềm dễ bảo trì.

---

## Lợi ích chính

### 1. Sắp xếp công việc tốt hơn
Người dùng có thể cấu trúc công việc thành các nhóm rõ ràng bằng bảng và danh sách, giúp dễ dàng theo dõi việc cần làm, việc đang thực hiện và việc đã hoàn thành.

### 2. Cải thiện cộng tác nhóm
Có thể gán thành viên vào bảng, giao việc cho người chịu trách nhiệm, và lịch sử hoạt động giúp mọi người luôn đồng bộ về tiến độ và các quyết định.

### 3. Hiển thị rõ ràng các ưu tiên
Với mức độ ưu tiên, ngày bắt đầu, ngày đến hạn, bình luận và trạng thái hoàn thành, các nhóm có thể nhanh chóng nắm được việc nào quan trọng nhất và việc nào cần chú ý tiếp theo.

### 4. Quy trình linh hoạt cho nhiều trường hợp sử dụng
Hệ thống đủ linh hoạt cho lập kế hoạch dự án, lập kế hoạch nội dung, theo dõi sự cố, quy trình tuyển dụng, công việc kỹ thuật và các công việc vận hành chung.

### 5. Thực hành kỹ thuật trong thế giới thực
Ứng dụng sử dụng các mẫu thiết kế thực tế như:

- xác thực và quản lý phiên đăng nhập;
- truy cập dữ liệu an toàn phía máy chủ;
- mã định danh tài nguyên được mã hóa;
- quan hệ cơ sở dữ liệu và tính nhất quán giao dịch;
- đồng bộ trạng thái giao diện sau khi thay đổi dữ liệu;
- quy tắc truy cập bảng và workspace theo vai trò.

### 6. Giá trị portfolio mạnh
Dự án thể hiện chiều sâu kỹ thuật, không chỉ là việc tạo giao diện. Nó cho thấy khả năng triển khai một hệ thống bao gồm luồng người dùng, logic backend, thiết kế cơ sở dữ liệu, nguyên tắc bảo mật và các mẫu frontend hiện đại trong một sản phẩm thống nhất.

---

## Tính năng cốt lõi

### Quản lý workspace
- Tạo và quản lý workspace cho các nhóm hoặc dự án khác nhau.
- Tổ chức các bảng liên quan trong một workspace.
- Hỗ trợ nhiều người dùng trong cùng một workspace.
- Định nghĩa vai trò người dùng và quyền truy cập ở cấp workspace.

### Quản lý bảng
- Tạo bảng bên trong workspace.
- Gán màu sắc và hình nền cho bảng.
- Giữ các bảng được tổ chức theo dự án hoặc lĩnh vực của nhóm.
- Hỗ trợ chia sẻ bảng và quản lý thành viên.
- Duy trì chế độ hiển thị và kiểm soát truy cập của bảng.

### Danh sách và cột
- Tạo nhiều danh sách đại diện cho các giai đoạn hoặc trạng thái như To do, In progress, Review, Done.
- Sắp xếp lại thứ tự danh sách để phản ánh thay đổi trong quy trình làm việc.
- Duy trì thứ tự và cấu trúc danh sách với các cập nhật trạng thái đáng tin cậy.

### Quản lý thẻ
- Tạo tác vụ dạng thẻ với tiêu đề, mô tả và siêu dữ liệu.
- Di chuyển thẻ giữa các danh sách.
- Kéo và thả thẻ để có trải nghiệm Kanban tự nhiên hơn.
- Sắp xếp lại thẻ trong một danh sách hoặc giữa các danh sách.
- Đặt mức độ ưu tiên cho thẻ: Low, Medium, High, Urgent.
- Đánh dấu thẻ là hoàn thành hoặc chưa hoàn thành.

### Hạn chót và lập lịch
- Gán ngày bắt đầu và ngày đến hạn.
- Nhóm công việc theo mức độ khẩn cấp và thời hạn.
- Hiển thị các tác vụ cần chú ý sớm.
- Cải thiện việc lập kế hoạch thời gian cho các cam kết cá nhân và nhóm.

### Bình luận và theo dõi hoạt động
- Thêm bình luận vào thẻ.
- Theo dõi các cập nhật như thay đổi trạng thái, thay đổi phân công và thay đổi ngày tháng.
- Duy trì dòng thời gian hoạt động minh bạch để đảm bảo trách nhiệm giải trình.

### Phân công người dùng và cộng tác
- Thêm thành viên vào bảng và workspace.
- Gán thành viên cho thẻ bằng email hoặc danh tính người dùng.
- Quản lý quyền cho quản trị viên bảng và thành viên không phải quản trị viên.
- Tăng trách nhiệm giải trình và giảm khoảng trống trong phối hợp.

### Hỗ trợ tệp đính kèm
- Tải lên và lưu trữ an toàn các tệp đính kèm liên quan đến tác vụ.
- Truy cập phương tiện thông qua các bước kiểm tra quyền đã được xác minh.
- Hỗ trợ tài liệu dự án phong phú ngay trên thẻ.

### Xác thực và bảo mật
- Đăng nhập bằng email/mật khẩu với mật khẩu được băm an toàn.
- Quản lý phiên dựa trên NextAuth.
- Tùy chọn Google OAuth khi được cấu hình.
- Mã định danh được mã hóa trong URL tài nguyên.
- Các hành động phía máy chủ được bảo vệ khi truy cập dữ liệu workspace và bảng.

### UI/UX hiện đại
- Giao diện đáp ứng (responsive) cho máy tính để bàn và màn hình lớn.
- Phân cấp rõ ràng và điều hướng quy trình trực quan.
- Điều khiển khi di chuột qua thẻ và các tương tác chỉnh sửa nhanh.
- Các tín hiệu trực quan cho tác vụ, thành viên, trạng thái hoàn thành và mức độ khẩn cấp.

### Khả năng chịu lỗi và tính nhất quán dữ liệu
- Tích hợp Prisma với MySQL để lưu trữ dữ liệu có cấu trúc.
- Cập nhật theo giao dịch khi sắp xếp lại và di chuyển tác vụ.
- Toàn vẹn quan hệ giữa workspace, bảng, danh sách và thẻ.
- Xử lý lỗi và trạng thái tải rõ ràng để có trải nghiệm người dùng tốt hơn.

---

## Công nghệ sử dụng

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

### Backend và tầng dữ liệu
- Next.js App Router
- Prisma ORM
- Cơ sở dữ liệu MySQL
- Server actions cho logic thay đổi dữ liệu an toàn

### Xác thực và quản lý phiên
- NextAuth
- Đăng nhập bằng thông tin xác thực (credentials)
- Hỗ trợ Google OAuth

### Thư viện năng suất và tương tác
- @dnd-kit cho tương tác kéo thả
- Formik để xử lý biểu mẫu
- TanStack React Query để đồng bộ dữ liệu phía client

### Đám mây và phương tiện
- Cloudinary để xử lý tệp đính kèm/phương tiện

---

## Tổng quan kiến trúc

Dự án tuân theo cấu trúc phân lớp rõ ràng, phù hợp với các quy ước ứng dụng full-stack hiện đại:

- `app/` — các trang route, layout, provider, server action và các tính năng của App Router.
- `app/components/` — các thành phần UI nguyên tử được chia thành atoms, molecules, organisms và templates.
- `app/features/` — điều phối tính năng và logic cấp route.
- `app/actions/` — các server action theo từng miền cho workspace, bảng và danh sách.
- `app/types/` — các hợp đồng miền và mô hình dữ liệu có thể tuần tự hóa.
- `lib/` — hạ tầng dùng chung như cấu hình Prisma client.
- `utils/` — các hàm trợ giúp tái sử dụng, logic xác thực dữ liệu và tiện ích ID được mã hóa.
- `prisma/` — lược đồ cơ sở dữ liệu và các migration.
- `docs/` — tài liệu kiến trúc và hiện trạng dự án.

Cấu trúc này tách biệt các mối quan tâm về UI, logic nghiệp vụ và ranh giới lưu trữ dữ liệu, đồng thời giữ cho hệ thống dễ bảo trì và có khả năng mở rộng.

---

## Luồng dự án

Luồng người dùng điển hình trong ứng dụng:

1. Người dùng đăng ký hoặc đăng nhập.
2. Người dùng tạo hoặc vào một workspace.
3. Người dùng tạo một bảng cho một dự án hoặc sáng kiến.
4. Người dùng thêm các danh sách đại diện cho các giai đoạn của quy trình.
5. Người dùng tạo các thẻ đại diện cho tác vụ.
6. Người dùng gán thành viên, bình luận và đặt ngày đến hạn.
7. Người dùng di chuyển thẻ giữa các danh sách khi công việc tiến triển.
8. Các thành viên nhóm cộng tác bằng cùng một bảng và nguồn cấp hoạt động.

Luồng này phản ánh các hệ thống năng suất dựa trên Kanban phổ biến và quen thuộc với nhiều người dùng, giúp ứng dụng mang lại cảm giác tự nhiên và trực quan.

---

## Cân nhắc về bảo mật và độ tin cậy

Dự án được thiết kế với các mối quan tâm thực tế của ứng dụng:

- các mã định danh nhạy cảm được mã hóa và được xem như các tham chiếu mờ (opaque);
- các bước kiểm tra quyền truy cập được thực hiện trên máy chủ trước khi đọc hoặc thay đổi dữ liệu;
- truy cập cơ sở dữ liệu được giữ ở ranh giới phía máy chủ;
- các bí mật xác thực được lưu trong biến môi trường; và
- các lỗi khi tải dữ liệu được hiển thị rõ ràng thay vì âm thầm biến thành trạng thái rỗng.

Những thực hành này rất quan trọng để xây dựng các ứng dụng đáng tin cậy và có liên quan chặt chẽ đến công việc phần mềm chuyên nghiệp.

---

## Demo và sự phù hợp với portfolio

Repository này phù hợp cho:

- một dự án portfolio thể hiện kỹ năng kỹ thuật full-stack;
- một bản demo sản phẩm hoạt động được cho phỏng vấn hoặc thuyết trình kỹ thuật;
- một dự án học tập để hiểu kiến trúc Next.js và Prisma hiện đại;
- một nền tảng cho các cải tiến sản phẩm hoặc mở rộng tính năng SaaS trong tương lai.

Dự án đặc biệt mạnh về mặt portfolio vì kết hợp:

- tư duy sản phẩm hướng người dùng;
- chất lượng kiến trúc kỹ thuật;
- chiều sâu về backend và mô hình hóa dữ liệu;
- các mẫu thiết kế an toàn và có khả năng mở rộng;
- các mẫu UX tinh tế thường thấy trong các sản phẩm năng suất hiện đại.

---

## Ảnh chụp màn hình dự án

> Thêm ảnh chụp màn hình dự án của bạn tại đây. Phần này được cố ý để trống để cập nhật sau.
>
> Bố cục đề xuất:
>
> - Trang chủ (landing page)
> - Màn hình đăng nhập / xác thực
> - Tổng quan workspace
> - Màn hình chi tiết bảng
> - Chi tiết thẻ / bảng bình luận
> - Chế độ xem cộng tác nhóm / quản lý thành viên

### Chỗ dành cho ảnh chụp màn hình 1

![Chỗ dành cho ảnh chụp màn hình dự án 1](#)

### Chỗ dành cho ảnh chụp màn hình 2

![Chỗ dành cho ảnh chụp màn hình dự án 2](#)

### Chỗ dành cho ảnh chụp màn hình 3

![Chỗ dành cho ảnh chụp màn hình dự án 3](#)

---

## Bắt đầu

### Điều kiện tiên quyết

Trước khi chạy dự án này, hãy đảm bảo bạn có:

- Node.js 18+ hoặc phiên bản tương thích
- npm hoặc một trình quản lý gói khác
- MySQL đang chạy cục bộ hoặc trong môi trường được quản lý
- các biến môi trường đã được cấu hình cho phát triển cục bộ

### Cài đặt các phụ thuộc

```bash
npm install
```

### Cấu hình môi trường

Tạo tệp `.env` dựa trên thiết lập cục bộ của bạn và cấu hình các biến môi trường cần thiết, bao gồm:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (cho phát triển cục bộ nếu cần)
- `WORKSPACE_ID_ENCRYPTION_KEY`
- Các biến Google OAuth khi sử dụng đăng nhập bằng Google

Ví dụ:

```bash
DATABASE_URL="mysql://user:password@localhost:3306/trello_clone"
NEXTAUTH_SECRET="your_secret_here"
NEXTAUTH_URL="http://localhost:3000"
WORKSPACE_ID_ENCRYPTION_KEY="your_64_hex_character_key"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

> Không đưa các bí mật vào hệ thống quản lý phiên bản và tuyệt đối không commit các giá trị môi trường nhạy cảm.

### Tạo Prisma client

```bash
npm run db:generate
```

### Chạy migration cơ sở dữ liệu

```bash
npx prisma migrate dev
```

### Khởi động ứng dụng

```bash
npm run dev
```

Mở `http://localhost:3000` trong trình duyệt để xem ứng dụng.

---

## Các lệnh hữu ích của dự án

```bash
npm run dev
npm run build
npm run lint -- app
npx tsc --noEmit
npx prisma validate
npm run db:generate
```

---

## Lộ trình và các cải tiến trong tương lai

Dự án đã có một trải nghiệm sản phẩm cốt lõi vững chắc, và còn nhiều cơ hội để mở rộng thêm:

- tìm kiếm và lọc nâng cao trên các bảng và thẻ;
- bảng điều khiển hoạt động và phân tích;
- nhãn thẻ và thẻ tag tùy chỉnh;
- thông báo và nhắc nhở cho nhóm;
- chế độ xem lịch và lịch trình;
- mẫu bảng cho các quy trình lặp lại;
- xuất/nhập tác vụ và dữ liệu dự án;
- thêm các thiết lập phân quyền theo vai trò;
- cải thiện tối ưu cho thiết bị di động;
- cộng tác thời gian thực với cập nhật trực tiếp.

Những cải tiến này sẽ tiếp tục phát triển dự án từ một MVP mạnh thành một sản phẩm kiểu SaaS hoàn chỉnh hơn.

---

## Tóm tắt

TrelloClone là một ứng dụng quản lý dự án full-stack lấy cảm hứng từ Trello, được xây dựng để thể hiện kỹ thuật phần mềm thực tiễn, quy trình cộng tác và phát triển web hiện đại. Nó kết hợp các tính năng năng suất, các mẫu kiến trúc bảo mật và mô hình dữ liệu thực tế vào một sản phẩm duy nhất, phù hợp cho portfolio.

Dự án phù hợp để:

- thể hiện năng lực kỹ thuật phần mềm;
- giới thiệu kỹ năng phát triển full-stack;
- chứng minh tư duy sản phẩm và UX trong bối cảnh thực tế;
- trình bày một ứng dụng hoàn chỉnh theo quy trình làm việc trong portfolio hoặc buổi demo.

---

## Lời của tác giả

Dự án này được thiết kế như một ứng dụng quản lý bảng và tác vụ theo chuẩn production, có thể sử dụng thực tế và có giá trị portfolio cao. Nó có thể được mở rộng thành một sản phẩm cộng tác nâng cao hơn trong khi vẫn giữ nguyên kiến trúc sạch và mô hình logic nghiệp vụ.

Nếu bạn muốn, README này sau đó có thể được điều chỉnh thành:

- một phiên bản portfolio tiếng Anh trau chuốt hơn;
- một phiên bản trang chủ GitHub ngắn gọn;
- một phiên bản chỉ có tiếng Việt để trình bày tại địa phương; hoặc
- một README theo phong cách startup để kể chuyện sản phẩm với nhà đầu tư/demo.
