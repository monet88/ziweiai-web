# Svelte 5 runes and scoped CSS without Tailwind

Giao diện web cần độ phản ứng mượt mà và ngôn ngữ thiết kế tối giản, thanh lịch, tựa như trang giấy Notion. Chúng tôi quyết định sử dụng Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`) và CSS phạm vi cục bộ (scoped CSS) kết hợp CSS custom properties (`src/lib/theme/tokens.css`), từ chối tích hợp Tailwind CSS. Quyết định này giúp loại bỏ hoàn toàn boilerplate và runtime dư thừa, đồng thời giữ bộ token giao diện tĩnh tại, nhất quán và không bị phân mảnh bởi hàng loạt utility class.
