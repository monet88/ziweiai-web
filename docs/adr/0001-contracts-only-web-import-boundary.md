# Web client only imports @ziweiai/contracts

`apps/web` là gói ứng dụng client SvelteKit nằm cùng monorepo với các gói server-only `packages/core` và `packages/astro-engine`. Chúng tôi quyết định `apps/web` **chỉ được phép** import `@ziweiai/contracts` từ các package nội bộ, cấm tuyệt đối import trực tiếp hay gián tiếp `@ziweiai/core`, `@ziweiai/astro-engine`, `iztro`, hay `lunar-javascript`. Quyết định này nhằm ngăn chặn bundle client bị phình to bởi dữ liệu thiên văn nặng, bảo vệ logic thuật số độc quyền trên server, và triệt tiêu nguy cơ rò rỉ chữ Hán ra giao diện người dùng.
