import type { BlogPost, BlogCategory } from './types';

export const BLOG_CATEGORIES: readonly BlogCategory[] = [
  { id: 'all', label: 'Tất Cả Bài Viết' },
  { id: 'tu-vi', label: 'Tử Vi Đẩu Số' },
  { id: 'bat-tu', label: 'Bát Tự Tứ Trụ' },
  { id: 'kinh-dich', label: 'Kinh Dịch Lục Hào' },
  { id: 'nhan-tuong', label: 'Nhân Tướng Học' }
] as const;

export const BLOG_POSTS: readonly BlogPost[] = [
  {
    slug: 'y-nghia-14-chinh-tinh-tu-vi',
    title: 'Ý Nghĩa 14 Chính Tinh Trong Tử Vi Đẩu Số & Bí Quyết Nhận Biết Cung Mệnh',
    subtitle: 'Cẩm nang toàn thư về 14 ngôi sao nòng cốt quyết định vận mệnh, tính cách và công danh trọn đời.',
    category: 'tu-vi',
    categoryLabel: 'Tử Vi Đẩu Số',
    publishedAt: '2026-09-08',
    readTime: '7 phút đọc',
    author: {
      name: 'ViOS Thiên Cơ Các',
      role: 'Chuyên Gia Thuật Số ViOS'
    },
    summary: 'Khám phá trọn vẹn đặc tính âm dương ngũ hành của 14 chính tinh: Tử Vi, Thiên Cơ, Thái Dương, Vũ Khúc, Thiên Đồng, Liêm Trinh, Thiên Phủ, Thái Âm, Tham Lang, Cự Môn, Thiên Tướng, Thiên Lương, Thất Sát, Phá Quân.',
    keywords: [
      '14 chính tinh tử vi',
      'cung mệnh tử vi',
      'ý nghĩa sao tử vi',
      'lập lá số tử vi miễn phí',
      'tử vi đẩu số chính tông'
    ],
    tableOfContents: [
      { id: 'tong-quan', title: '1. Tổng Quan Về 14 Chính Tinh Trong Thiên Bàn' },
      { id: 'chom-tu-vi', title: '2. Nhóm Sao Vòng Tử Vi (6 Sao)' },
      { id: 'chom-thien-phu', title: '3. Nhóm Sao Vòng Thiên Phủ (8 Sao)' },
      { id: 'nhan-biet-cung-menh', title: '4. Cách Nhận Biết Chính Tinh Thủ Mệnh Của Bản Thân' },
      { id: 'hoi-dap-faq', title: '5. Câu Hỏi Thường Gặp Về Chính Tinh' }
    ],
    contentHtml: `
      <section id="tong-quan">
        <h2>1. Tổng Quan Về 14 Chính Tinh Trong Thiên Bàn</h2>
        <p>Trong hệ thống Tử Vi Đẩu Số, <strong>14 Chính Tinh</strong> được ví như 14 vị đại tướng quân trấn giữ 12 cung bản vị trên thiên bàn. Chúng chi phối tới 70% cốt cách, tài năng, xu hướng hành vi và những bước ngoặt thăng trầm lớn nhất trong cuộc đời một con người.</p>
        <p>14 chính tinh được chia thành 2 chòm sao lớn vận hành ngược chiều nhau:</p>
        <ul>
          <li><strong>Chòm sao Tử Vi (Bắc Đẩu Tinh)</strong>: Gồm 6 sao (Tử Vi, Thiên Cơ, Thái Dương, Vũ Khúc, Thiên Đồng, Liêm Trinh) an theo chiều nghịch kim đồng hồ.</li>
          <li><strong>Chòm sao Thiên Phủ (Nam Đẩu Tinh)</strong>: Gồm 8 sao (Thiên Phủ, Thái Âm, Tham Lang, Cự Môn, Thiên Tướng, Thiên Lương, Thất Sát, Phá Quân) an theo chiều thuận kim đồng hồ.</li>
        </ul>
      </section>

      <section id="chom-tu-vi">
        <h2>2. Nhóm Sao Vòng Tử Vi (6 Sao)</h2>
        <p>Chòm sao Bắc Đẩu chủ về uy quyền, tư duy chiến lược và năng lực lãnh đạo:</p>
        <ul>
          <li><strong>Tử Vi (Thổ - Đế Tinh)</strong>: Ngôi sao đế vương tối cao, tượng trưng cho phẩm cách cao quý, tư chất lãnh đạo bẩm sinh, bao dung và có tầm nhìn lớn.</li>
          <li><strong>Thiên Cơ (Mộc - Thiện Tinh)</strong>: Biểu tượng của trí tuệ, mưu lược, sự linh hoạt nhạy bén và khả năng ứng biến thần tốc trước thời cuộc.</li>
          <li><strong>Thái Dương (Hỏa - Nhật Tinh)</strong>: Ngôi sao quang minh lỗi lạc, tượng trưng cho người cha, người chồng, sự nghiệp rực rỡ và lòng vị tha rộng lớn.</li>
          <li><strong>Vũ Khúc (Kim - Tài Tinh)</strong>: Đại tài tinh chủ về tiền bạc, quản lý tài chính thực tiễn, tính cách quả quyết, kiên định và dám nghĩ dám làm.</li>
          <li><strong>Thiên Đồng (Thủy - Phúc Tinh)</strong>: Ngôi sao phúc thọ, thiện lương, yêu chuộng hòa bình, có khiếu nghệ thuật nhưng đôi khi thiếu tính kiên trì.</li>
          <li><strong>Liêm Trinh (Hỏa - Tù Tinh / Đào Hoa Tinh)</strong>: Ngôi sao đa tài, nghiêm cẩn, có tính kỷ luật cao độ nhưng giàu cảm xúc và tham vọng.</li>
        </ul>
      </section>

      <section id="chom-thien-phu">
        <h2>3. Nhóm Sao Vòng Thiên Phủ (8 Sao)</h2>
        <p>Chòm sao Nam Đẩu chủ về tích lũy của cải, bảo tồn tài nguyên và hành động quả cảm:</p>
        <ul>
          <li><strong>Thiên Phủ (Thổ - Lệnh Tinh)</strong>: Kho bạc trời ban, chủ về sự giàu sang, vững vàng, thận trọng, giỏi gìn giữ tài sản và quy tụ lòng người.</li>
          <li><strong>Thái Âm (Thủy - Nguyệt Tinh)</strong>: Biểu tượng cho người mẹ, người vợ, sự dịu dàng, nội tâm sâu sắc, bất động sản và tài lộc ẩn tàng.</li>
          <li><strong>Tham Lang (Thủy/Mộc - Đào Hoa Tinh)</strong>: Biểu tượng của đam mê, khát vọng trải nghiệm, tài ngoại giao xuất chúng và trực giác nhạy bén.</li>
          <li><strong>Cự Môn (Thủy - Ám Tinh)</strong>: Ngôi sao của ngôn từ, tài hùng biện, tư duy phản biện sắc bén và khả năng nghiên cứu chuyên sâu.</li>
          <li><strong>Thiên Tướng (Thủy - Ấn Tinh)</strong>: Vị tướng quân trung thành, trượng nghĩa, có phong thái đàng hoàng, thích giúp đỡ người yếu thế.</li>
          <li><strong>Thiên Lương (Mộc - Ấm Tinh)</strong>: Ngôi sao của y đức, nguyên tắc, sự che chở, sống trường thọ và có duyên với tâm linh, học thuật.</li>
          <li><strong>Thất Sát (Kim/Hỏa - Dũng Tinh)</strong>: Vị tướng tiên phong quyết liệt, can đảm phi thường, sẵn sàng đối mặt gian lao để lập đại nghiệp.</li>
          <li><strong>Phá Quân (Thủy - Hao Tinh)</strong>: Ngôi sao cách tân, dũng mãnh phá bỏ cái cũ để kiến tạo cái mới, ưa mạo hiểm và tiên phong đổi mới.</li>
        </ul>
      </section>

      <section id="nhan-biet-cung-menh">
        <h2>4. Cách Nhận Biết Chính Tinh Thủ Mệnh Của Bản Thân</h2>
        <p>Cung Mệnh trên lá số đại diện cho bản ngã cốt lõi. Để biết chính xác sao nào đang toạ thủ cung Mệnh, bạn cần thông tin ngày, tháng, năm sinh (Dương lịch hoặc Âm lịch) và giờ sinh chuẩn xác (theo giờ địa phương GMT+7).</p>
        <p>Khi an sao trên ViOS, hệ thống sẽ tự động tính toán vị trí của 14 chính tinh cùng hệ thống Tứ Hóa (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ) để giúp bạn nhận diện rõ thiên hướng sự nghiệp, tài lộc và nhân duyên cuộc đời.</p>
      </section>
    `,
    faqs: [
      {
        question: 'Cung Mệnh vô chính diệu (không có chính tinh) thì có sao không?',
        answer: 'Mệnh Vô Chính Diệu là hiện tượng bình thường trong Tử Vi (chiếm tỷ lệ khá cao). Khi Mệnh không có chính tinh, bản mệnh sẽ mượn ánh sáng của chính tinh ở cung xung chiếu (cung Thiên Di) và chịu ảnh hưởng mạnh mẽ từ các phụ tinh đắc địa tọa thủ.'
      },
      {
        question: 'Hai người cùng giờ sinh có lá số giống hệt nhau không?',
        answer: 'Về mặt toán học thiên văn, hai người sinh cùng năm tháng ngày giờ sẽ có cùng thiên bàn an sao. Tuy nhiên, phúc đức tổ tiên, môi trường sống, gia đạo và sự nỗ lực tự thân (Tam Tài: Thiên - Địa - Nhân) sẽ tạo nên những biểu hiện và lựa chọn khác nhau trong đời thực.'
      }
    ],
    cta: {
      title: 'Khám Phá Cung Mệnh Tử Vi Của Bạn Ngay Hôm Nay',
      desc: 'Nhập thông tin ngày giờ sinh để an sao 14 chính tinh chuẩn xác theo cổ thư hoàng gia và nhận ngay bản phân tích cung Mệnh hoàn toàn miễn phí.',
      actionLabel: 'Lập Lá Số Tử Vi Miễn Phí 100%',
      actionRoute: '/charts',
      badge: 'MIỄN PHÍ 100%'
    }
  },
  {
    slug: 'bat-tu-tu-tru-can-bang-ngu-hanh-dung-than',
    title: 'Bát Tự Tứ Trụ Toàn Thư: Cách Xác Định Dụng Thần & Hỷ Thần Để Cải Vận May Mắn',
    subtitle: 'Bí pháp cân bằng ngũ hành khuyết thiếu dựa trên Can Chi Năm - Tháng - Ngày - Giờ sinh.',
    category: 'bat-tu',
    categoryLabel: 'Bát Tự Tứ Trụ',
    publishedAt: '2026-09-09',
    readTime: '8 phút đọc',
    author: {
      name: 'ViOS Hà Lạc Các',
      role: 'Chuyên Gia Thuật Số ViOS'
    },
    summary: 'Hiểu rõ bản chất Bát Tự Tứ Trụ, cách phân định Thân Vượng hay Thân Nhược qua Nhật Chủ, và bí thuật tìm Dụng Thần để điều chỉnh hướng nghiệp, màu sắc, đối tác kinh doanh nhằm kích hoạt tài vận hưng thịnh.',
    keywords: [
      'bát tự tứ trụ',
      'dụng thần bát tự',
      'thân vượng thân nhược',
      'can chi ngũ hành',
      'hồ sơ bát tự hoàng gia'
    ],
    tableOfContents: [
      { id: 'bat-tu-la-gi', title: '1. Bát Tự Tứ Trụ Là Gì?' },
      { id: 'nhat-chu-va-ngu-hanh', title: '2. Nhật Chủ — Trục Xương Sống Bản Mệnh' },
      { id: 'dung-than-hy-than', title: '3. Khái Niệm Dụng Thần & Hỷ Thần Cải Vận' },
      { id: 'ung-dung-cai-van', title: '4. Ứng Dụng Dụng Thần Vào Đời Sống Thực Tiễn' },
      { id: 'faq-bat-tu', title: '5. Hỏi Đáp Về Bát Tự' }
    ],
    contentHtml: `
      <section id="bat-tu-la-gi">
        <h2>1. Bát Tự Tứ Trụ Là Gì?</h2>
        <p><strong>Bát Tự</strong>, hay còn gọi là <strong>Tứ Trụ</strong>, là hệ thống dự đoán vận mệnh cổ xưa dựa trên 4 trụ thời gian sinh của một người: <em>Trụ Năm, Trụ Tháng, Trụ Ngày và Trụ Giờ</em>. Mỗi trụ gồm 1 Thiên Can và 1 Địa Chi, kết hợp thành 8 chữ (Bát Tự).</p>
        <p>Khác với Tử Vi chú trọng vào hệ thống sao, Bát Tự đi sâu vào <strong>quy luật tương sinh tương khắc của Ngũ Hành (Kim, Mộc, Thủy, Hỏa, Thổ)</strong> và Thập Thần (Chính Quan, Thất Sát, Chính Ấn, Thiên Ấn, Chính Tài, Thiên Tài, Thực Thần, Thương Quan, Tỷ Kiên, Kiếp Tài).</p>
      </section>

      <section id="nhat-chu-va-ngu-hanh">
        <h2>2. Nhật Chủ — Trục Xương Sống Bản Mệnh</h2>
        <p>Thiên Can của Trụ Ngày sinh được gọi là <strong>Nhật Chủ (hoặc Nhật Nguyên)</strong>. Đây chính là đại diện cho bản thân bạn:</p>
        <ul>
          <li>Nếu bạn sinh ngày <strong>Giáp/Ất</strong>: Nhật Chủ hành Mộc.</li>
          <li>Nếu bạn sinh ngày <strong>Bính/Đinh</strong>: Nhật Chủ hành Hỏa.</li>
          <li>Nếu bạn sinh ngày <strong>Mậu/Kỷ</strong>: Nhật Chủ hành Thổ.</li>
          <li>Nếu bạn sinh ngày <strong>Canh/Tân</strong>: Nhật Chủ hành Kim.</li>
          <li>Nếu bạn sinh ngày <strong>Nhâm/Quý</strong>: Nhật Chủ hành Thủy.</li>
        </ul>
        <p>Dựa trên mùa sinh (Trụ Tháng - Lệnh Tháng) và sự hỗ trợ của các can chi còn lại, Nhật Chủ sẽ rơi vào trạng thái <strong>Thân Vượng (năng lượng quá mạnh)</strong> hoặc <strong>Thân Nhược (năng lượng thiếu hụt)</strong>.</p>
      </section>

      <section id="dung-than-hy-than">
        <h2>3. Khái Niệm Dụng Thần & Hỷ Thần Cải Vận</h2>
        <p>Bát Tự cốt tủy ở chữ <em>"Bình Hòa"</em> (cân bằng). Một bát tự quá nóng (nhiều Hỏa) thì cần Thủy làm mát; một bát tự quá lạnh (sinh mùa đông nhiều Thủy) thì cần Hỏa sưởi ấm.</p>
        <p><strong>Dụng Thần</strong> chính là ngũ hành vị thuốc quý giá nhất giúp đưa toàn bộ lá số về trạng thái cân bằng. Người tìm được đúng Dụng Thần và đi vào các đại vận tương trợ Dụng Thần sẽ gặp thuận lợi lớn trong công danh, tài chính và sức khỏe.</p>
      </section>

      <section id="ung-dung-cai-van">
        <h2>4. Ứng Dụng Dụng Thần Vào Đời Sống Thực Tiễn</h2>
        <p>Sau khi xác định được Dụng Thần, bạn có thể chủ động cải biến môi trường sống:</p>
        <ul>
          <li><strong>Phương vị sinh sống & làm việc</strong>: Chọn thành phố, phương hướng nhà cửa theo hướng ngũ hành Dụng Thần.</li>
          <li><strong>Ngành nghề kinh doanh</strong>: Đầu tư vào các lĩnh vực tương thích với Dụng Thần để gia tăng tỷ lệ thắng lợi.</li>
          <li><strong>Màu sắc & vật phẩm phong thủy</strong>: Sử dụng tông màu trang phục, xe cộ, đá phong thủy trợ lực.</li>
        </ul>
      </section>
    `,
    faqs: [
      {
        question: 'Thân Vượng tốt hơn hay Thân Nhược tốt hơn?',
        answer: 'Không có trạng thái nào tuyệt đối tốt hơn. Người Thân Vượng có sức chịu đựng tốt, quyết đoán nhưng dễ độc đoán; người Thân Nhược mềm mỏng, thích nghi nhanh nhưng dễ bị phân tâm. Điều quan trọng nhất là gặp được đại vận có Dụng Thần tương trợ.'
      },
      {
        question: 'Dụng Thần trong Bát Tự có thay đổi theo thời gian không?',
        answer: 'Dụng Thần cốt lõi của nguyên cục bản mệnh là cố định. Tuy nhiên, khi bước sang từng Đại Vận 10 năm và Lưu Niên từng năm, sự biến đổi khí ngũ hành có thể khiến người luận giải linh hoạt sử dụng thêm Hỷ Thần để cân bằng thời vận.'
      }
    ],
    cta: {
      title: 'Tra Cứu Bát Tự Tứ Trụ & Xác Định Dụng Thần Ngay',
      desc: 'Hệ thống tự động lập bảng Can Chi, tính toán tỷ lệ ngũ hành vượng suy và chỉ ra Dụng Thần hộ mệnh cho bạn chỉ sau 1 chạm.',
      actionLabel: 'Lập Lá Số Bát Tự Miễn Phí 100%',
      actionRoute: '/bazi',
      badge: 'MIỄN PHÍ 100%'
    }
  },
  {
    slug: 'huong-dan-gieo-que-kinh-dich-luc-hao',
    title: 'Hướng Dẫn Gieo Quẻ Kinh Dịch Lục Hào: Giải Đoán Cát Hung Sự Nghiệp & Tài Vận Tức Thời',
    subtitle: 'Nghệ thuật chiêm bốc 3 đồng tiền cổ dự báo sự vụ chuẩn xác hàng ngàn năm.',
    category: 'kinh-dich',
    categoryLabel: 'Kinh Dịch Lục Hào',
    publishedAt: '2026-09-10',
    readTime: '6 phút đọc',
    author: {
      name: 'ViOS Dịch Học Các',
      role: 'Chuyên Gia Thuật Số ViOS'
    },
    summary: 'Tìm hiểu nghi thức khởi tâm gieo 3 đồng tiền cổ, cấu trúc 64 quẻ dịch, cách nhận diện Hào Động và Quẻ Biến để định hướng đầu tư, thăng tiến công danh, đối tác và tình duyên trong những khoảnh khắc lưỡng lự.',
    keywords: [
      'kinh dịch lục hào',
      'gieo quẻ 3 đồng xu',
      'quẻ chủ quẻ biến',
      'hào động kinh dịch',
      'bói quẻ dịch online miễn phí'
    ],
    tableOfContents: [
      { id: 'nguyen-ly-luc-hao', title: '1. Nguyên Lý Vận Hành Của Quẻ Lục Hào' },
      { id: 'nghi-thuc-gieo-que', title: '2. Nghi Thức Khởi Tâm Gieo 3 Đồng Tiền' },
      { id: 'que-chu-que-bien', title: '3. Cách Đọc Quẻ Chủ, Hào Động & Quẻ Biến' },
      { id: 'loi-khuyen-hanh-dong', title: '4. Lời Khuyên Hành Động Theo Chu Dịch' },
      { id: 'faq-kinh-dich', title: '5. Câu Hỏi Thường Gặp Khi Gieo Quẻ' }
    ],
    contentHtml: `
      <section id="nguyen-ly-luc-hao">
        <h2>1. Nguyên Lý Vận Hành Của Quẻ Lục Hào</h2>
        <p><strong>Kinh Dịch Lục Hào</strong> là tinh hoa chiêm bốc tối cổ phương Đông, do Thánh nhân Phục Hy và Chu Văn Vương đúc kết. Khác với việc dự đoán cả đời như Tử Vi, Lục Hào chuyên dùng để <strong>giải quyết một vấn đề cụ thể, tức thời</strong>: <em>Có nên hợp tác dự án này không? Công việc sắp tới có hanh thông? Đầu tư mảnh đất này có lời không?</em></p>
        <p>Cơ chế của Lục Hào dựa trên nguyên lý <em>Đồng Thanh Tương Ứng, Đồng Khí Tương Cầu</em> và sự tương tác giữa sóng não người hỏi với trường năng lượng vũ trụ tại thời khắc gieo quẻ.</p>
      </section>

      <section id="nghi-thuc-gieo-que">
        <h2>2. Nghi Thức Khởi Tâm Gieo 3 Đồng Tiền</h2>
        <p>Để quẻ dịch đạt độ linh ứng tuyệt đối, cổ thư nhấn mạnh nguyên tắc <em>"Thành tâm tất ứng"</em>:</p>
        <ol>
          <li><strong>Tịnh tâm 30 giây</strong>: Hít thở sâu, loại bỏ tạp niệm, giữ tinh thần thư thái.</li>
          <li><strong>Tập trung vào duy nhất một câu hỏi</strong>: Câu hỏi càng rõ ràng, câu trả lời càng chuẩn xác (tránh hỏi chung chung kiểu "tương lai tôi ra sao").</li>
          <li><strong>Gieo 6 lần liên tiếp</strong>: Mỗi lần gieo 3 đồng tiền cổ để tạo nên một hào (từ hào 1 ở đáy lên hào 6 ở trên cùng).</li>
        </ol>
      </section>

      <section id="que-chu-que-bien">
        <h2>3. Cách Đọc Quẻ Chủ, Hào Động & Quẻ Biến</h2>
        <p>Mỗi quẻ Lục Hào gồm 2 phần cốt lõi:</p>
        <ul>
          <li><strong>Quẻ Chủ (Tiền Đề)</strong>: Phản ánh trung thực bối cảnh hiện tại, nguyên nhân sâu xa và thực trạng của vấn đề bạn đang gặp phải.</li>
          <li><strong>Hào Động (Điểm Kích Hoạt)</strong>: Nơi năng lượng chuyển hóa mạnh mẽ nhất, chỉ rõ nguyên nhân mấu chốt gây nên sự thay đổi.</li>
          <li><strong>Quẻ Biến (Kết Quả Cuối Cùng)</strong>: Dự báo diễn biến tương lai nếu bạn tiếp tục hành động theo xu hướng hiện tại.</li>
        </ul>
      </section>

      <section id="loi-khuyen-hanh-dong">
        <h2>4. Lời Khuyên Hành Động Theo Chu Dịch</h2>
        <p>Kinh Dịch không dạy con người phó mặc cho số phận. Giá trị tối thượng của Chu Dịch là <em>"Tri cơ nhi tác"</em> (biết trước cơ hội và rủi ro để hành động đúng lúc). Khi gặp quẻ Cát thì nắm bắt thần tốc; khi gặp quẻ Hung thì thận trọng phòng ngừa, giữ mình để chuyển bại thành thắng.</p>
      </section>
    `,
    faqs: [
      {
        question: 'Một ngày có thể gieo quẻ nhiều lần không?',
        answer: 'Cổ nhân dạy: "Sơ phệ cáo, tái tam độc, độc tắc bất cáo" (Hỏi lần đầu thì báo, hỏi đi hỏi lại 2-3 lần về cùng một việc là bất kính, quẻ sẽ không còn linh ứng). Bạn chỉ nên gieo 1 lần cho 1 sự vụ cụ thể.'
      },
      {
        question: 'Gieo quẻ online tự động trên máy tính có chính xác như gieo đồng xu thật không?',
        answer: 'Thuật số ViOS sử dụng thuật toán gieo xu mô phỏng cơ học chính xác kết hợp thời khắc tâm niệm của người dùng khi nhấn nút gieo, bảo toàn trọn vẹn nguyên lý thời không của Kinh Dịch.'
      }
    ],
    cta: {
      title: 'Khởi Tâm Gieo 3 Đồng Tiền Cổ Kinh Dịch Ngay',
      desc: 'Bấm nút gieo tự động 6 lần để thiết lập Quẻ Chủ, Quẻ Biến và nhận ngay lời phân tích hào động rõ ràng, minh triết.',
      actionLabel: 'Gieo Quẻ Lục Hào Miễn Phí 100%',
      actionRoute: '/liuyao',
      badge: 'MIỄN PHÍ 100%'
    }
  },
  {
    slug: 'nhan-tuong-hoc-khuon-mat-ai-vision',
    title: 'Bí Thuật Nhân Tướng Học: Đọc Vị Tâm Tính & Vận Trình Qua Ngũ Quan Khuôn Mặt',
    subtitle: 'Ứng dụng công nghệ AI Vision phân tích diện tướng chuẩn xác theo cổ thư Ma Y Thần Tướng.',
    category: 'nhan-tuong',
    categoryLabel: 'Nhân Tướng Học',
    publishedAt: '2026-09-11',
    readTime: '7 phút đọc',
    author: {
      name: 'ViOS Tướng Pháp Các',
      role: 'Chuyên Gia Thuật Số ViOS'
    },
    summary: 'Nhân tướng học qua Tam Đình (Thượng - Trung - Hạ Đình) và Ngũ Quan (Mắt, Mũi, Tai, Miệng, Lông Mày) tiết lộ phúc lộc, sức khỏe và hậu vận. Khám phá cách AI Vision scan sinh trắc học diện tướng hiện đại.',
    keywords: [
      'nhân tướng học',
      'xem tướng mặt ai',
      'ngũ quan khuôn mặt',
      'ma y thần tướng',
      'tam đình ngũ nhạc'
    ],
    tableOfContents: [
      { id: 'nguyen-ly-nhan-tuong', title: '1. Cội Nguồn Của Nhân Tướng Học Phương Đông' },
      { id: 'tam-dinh-khuon-mat', title: '2. Tam Đình: 3 Giai Đoạn Cuộc Đời' },
      { id: 'ngu-quan-tinh-tuy', title: '3. Ngũ Quan Tiết Lộ Tính Cách & Tài Lộc' },
      { id: 'ai-vision-scan', title: '4. Đột Phá AI Vision Scan Sinh Trắc Diện Tướng' },
      { id: 'faq-nhan-tuong', title: '5. Hỏi Đáp Về Nhân Tướng Học' }
    ],
    contentHtml: `
      <section id="nguyen-ly-nhan-tuong">
        <h2>1. Cội Nguồn Của Nhân Tướng Học Phương Đông</h2>
        <p>Cổ nhân có câu: <em>"Tâm sinh tướng, tướng tùy tâm diệt"</em>. Khuôn mặt của mỗi con người không đơn thuần là đặc điểm sinh học ngẫu nhiên, mà là tấm bản đồ ghi lại thói quen tư duy, cảm xúc, sức khỏe tạng phủ và vận trình phúc họa tích lũy qua năm tháng.</p>
        <p>Từ bộ kinh điển <strong>Ma Y Thần Tướng</strong> đến <strong>Liễu Trang Tướng Pháp</strong>, nhân tướng học đã được các bậc đế vương sử dụng như một môn khoa học thực tiễn để nhìn người, dùng người và định vị đối tác.</p>
      </section>

      <section id="tam-dinh-khuon-mat">
        <h2>2. Tam Đình: 3 Giai Đoạn Cuộc Đời</h2>
        <p>Khuôn mặt được phân chia theo chiều dọc thành 3 phần đại diện cho Tiền vận, Trung vận và Hậu vận:</p>
        <ul>
          <li><strong>Thượng Đình (Từ chân tóc đến chân mày)</strong>: Đại diện cho Tiền vận (dưới 30 tuổi), chủ về trí tuệ, nền tảng giáo dục gia đình và phúc ấm tổ tiên.</li>
          <li><strong>Trung Đình (Từ chân mày đến chóp mũi)</strong>: Đại diện cho Trung vận (31 - 50 tuổi), thời kỳ lập thân, ý chí tiến thủ, khả năng gây dựng tài chính và hôn nhân.</li>
          <li><strong>Hạ Đình (Từ nhân trung đến cằm)</strong>: Đại diện cho Hậu vận (sau 50 tuổi), chủ về đất đai tài sản, con cái, sức khỏe tuổi xế chiều và sự an hưởng.</li>
        </ul>
      </section>

      <section id="ngu-quan-tinh-tuy">
        <h2>3. Ngũ Quan Tiết Lộ Tính Cách & Tài Lộc</h2>
        <p>Ngũ quan trên khuôn mặt tương ứng với 5 cơ quan thu nhận năng lượng và biểu đạt nội tâm:</p>
        <ul>
          <li><strong>Mắt (Giám sát quan)</strong>: Cửa sổ tâm hồn, phản ánh sự thông minh, chân thành, thần khí và khả năng nhìn nhận thời thế.</li>
          <li><strong>Mũi (Thẩm biện quan - Cung Tài Bạch)</strong>: Đại diện cho khả năng kiếm tiền và giữ tiền. Sống mũi thẳng, chóp mũi nở nang là tướng vượng tài.</li>
          <li><strong>Tai (Thính thính quan)</strong>: Phản ánh thọ mệnh, phúc đức gia đạo và khả năng tiếp thu lời khuyên của người khác.</li>
          <li><strong>Miệng (Xuất nạp quan)</strong>: Biểu hiện tài ăn nói, chữ tín, phong cách lãnh đạo và phúc hưởng ẩm thực.</li>
          <li><strong>Lông mày (Bảo thọ quan)</strong>: Thể hiện khí chất, mối quan hệ anh em đồng nghiệp và tuổi thọ.</li>
        </ul>
      </section>

      <section id="ai-vision-scan">
        <h2>4. Đột Phá AI Vision Scan Sinh Trắc Diện Tướng</h2>
        <p>Ngày nay, với sự hỗ trợ của mô hình thị giác AI (Computer Vision) kết hợp kho tri thức cổ thư đồ sộ, ViOS đã phát triển tính năng <strong>AI Vision Scan</strong>: Phân tích tỷ lệ khuôn mặt, ngũ quan và cung tài bạch qua một bức ảnh chân dung với độ chính xác cao chỉ trong 30 giây.</p>
      </section>
    `,
    faqs: [
      {
        question: 'Phẫu thuật thẩm mỹ có làm thay đổi số mệnh không?',
        answer: 'Thẩm mỹ chỉnh sửa ngũ quan (như nâng mũi, cắt mí) có thể giúp bạn tự tin hơn trong giao tiếp. Tuy nhiên, cổ thư nhấn mạnh "Tướng tự tâm sinh". Muốn cải biến vận mệnh cốt lõi, việc tu dưỡng tâm tính, nâng cao trí tuệ và làm việc thiện lành mới là yếu tố quyết định bền vững.'
      },
      {
        question: 'Tướng mặt có thay đổi theo năm tháng không?',
        answer: 'Hoàn toàn có! Khí sắc, nếp nhăn và ánh mắt (Thần Khí) thay đổi liên tục theo suy nghĩ, lối sống và sức khỏe của bạn. Sau 5-10 năm tích lũy năng lượng tích cực, diện mạo sẽ trở nên đôn hậu, sáng sủa và phúc hậu hơn rõ rệt.'
      }
    ],
    cta: {
      title: 'Trải Nghiệm AI Vision Scan Diện Tướng Ngay',
      desc: 'Tải lên bức ảnh chân dung rõ nét để AI thị giác phân tích ngũ quan, tam đình và dự đoán vận trình tài lộc thần tốc.',
      actionLabel: 'Trải Nghiệm AI Vision Scan',
      actionRoute: '/face',
      badge: '50 XU • AI SCAN'
    }
  }
];

export function getBlogPostBySlug(slug: string | undefined): BlogPost | undefined {
  if (!slug) return undefined;
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelatedPosts(currentSlug: string | undefined, limit = 3): BlogPost[] {
  if (!currentSlug) return BLOG_POSTS.slice(0, limit);
  return BLOG_POSTS.filter((p) => p.slug !== currentSlug).slice(0, limit);
}
