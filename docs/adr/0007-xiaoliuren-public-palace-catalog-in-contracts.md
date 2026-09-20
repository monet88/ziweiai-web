# Tiểu Lục Nhâm public palace catalog belongs to Contracts

Tiểu Lục Nhâm có một bộ Lục Cung công khai được cả Astro Engine và Web sử dụng, và bản sao riêng trên Web đã phát sinh sai lệch mức cát hung so với engine. Chúng tôi quyết định "@ziweiai/contracts" là nguồn sự thật duy nhất cho metadata công khai của Lục Cung; Astro Engine dùng catalog này khi tính quẻ, Web chỉ render dữ liệu từ Contracts, còn thuật toán lập quẻ, lịch pháp và mọi logic server-only vẫn thuộc Astro Engine theo ADR-0001.
