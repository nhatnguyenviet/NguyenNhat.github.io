# Nhat's garden — website cá nhân song ngữ (English / Tiếng Việt)

Trang web tĩnh, host miễn phí trên GitHub Pages. **Toàn bộ nội dung nằm trong thư mục `content/` và `media/`**, nên muốn sửa gì bạn chỉ cần sửa ở đó, không phải đụng vào code.

## Cấu trúc

```
index.html              Trang chọn ngôn ngữ (English / Tiếng Việt). Lần sau khách vào sẽ tự nhớ lựa chọn.
home.html               Trang chủ
writing.html            Danh sách bài viết
photos.html             Trang ảnh: danh sách album → bấm vào để xem từng album
post.html               Trang hiển thị một bài viết

content/site.json       ← THÔNG TIN, CHỮ HAI THỨ TIẾNG, BẬT/TẮT MỤC, MÀU SẮC, PHÔNG CHỮ
content/albums/*.json   ← ALBUM ẢNH (mỗi album một file: tokyo.json, osaka.json…)
content/posts/*.md      ← BÀI VIẾT (mỗi bài một file)
media/                  ← ẢNH VÀ FILE (CV…)

.pages.yml              Cấu hình cho trình sửa nội dung Pages CMS
.github/workflows/      GitHub tự cập nhật danh sách bài viết và đăng web sau mỗi thay đổi
scripts/build_index.py  Script tạo danh sách bài viết (chạy tự động)
assets/                 Giao diện và code (thường không cần sửa)
```

---

## 1. Đưa lên GitHub Pages (làm một lần)

1. Tạo repository **Public** tên `<username>.github.io`.
2. Upload **toàn bộ nội dung** thư mục này, kể cả thư mục `.github` và file `.pages.yml`.
   - Thư mục và file bắt đầu bằng dấu chấm bị ẩn trên macOS (nhấn `Cmd + Shift + .` để hiện). Nếu kéo thả lên GitHub bị thiếu, hãy dùng GitHub Desktop hoặc lệnh `git push`.
3. Vào **Settings → Pages → Build and deployment → Source** và chọn **GitHub Actions**. Đây là bước quan trọng: chọn sai thì danh sách bài viết sẽ không tự cập nhật.
4. Vào tab **Actions** để xem quá trình đăng web. Khi có dấu ✓ xanh, website đã chạy tại `https://<username>.github.io`.

## 2. Sửa nội dung bằng giao diện web (Pages CMS), không cần code

1. Mở **https://app.pagescms.org** → đăng nhập bằng GitHub.
2. Cài GitHub App của Pages CMS cho tài khoản của bạn, rồi chọn repo `<username>.github.io`.
3. Bạn sẽ thấy 3 mục ở thanh bên trái:
   - **Bài viết / Posts**: bấm *Add an entry* để viết bài mới. Chọn ngôn ngữ (vi/en), ngày, tiêu đề rồi viết nội dung. Có thể chèn ảnh ngay trong bài. Tick **Draft** nếu muốn giấu bài viết khỏi trang.
   - **Album ảnh / Photo albums**: mỗi album là một nơi (Tokyo, Osaka…). Trong album có danh sách **mốc thời gian**, mỗi mốc gồm ngày, tiêu đề và nhiều ảnh (chọn được nhiều ảnh cùng lúc). Muốn thêm ảnh Osaka mới: mở album Osaka, bấm thêm một mốc thời gian, tải ảnh lên rồi Save. Muốn tạo album mới (vd Kyoto): bấm *Add an entry*.
   - **Trang chủ & giao diện**: sửa giới thiệu, timeline, nghiên cứu, học vấn, liên hệ. Trong đây cũng có phần **Hiện/ẩn các mục** và **Giao diện**: màu nền, màu chữ, màu nhấn, phông chữ, cỡ chữ.
4. Bấm **Save**. Pages CMS lưu thẳng lên GitHub, và trang web tự cập nhật sau khoảng 1–2 phút.

> **Viết công thức toán:** dùng `$...$` (trong dòng) hoặc `$$...$$` (riêng một dòng). Ví dụ: `$$ S = \frac{R_a}{R_g} $$`. Nên bấm nút chuyển sang chế độ **Markdown/source** của trình soạn thảo khi gõ công thức.

## 3. Hoặc sửa trực tiếp file

- Trên GitHub: mở file, bấm biểu tượng ✏️ để sửa, rồi *Commit changes*. Muốn tải ảnh thì vào thư mục `media/` → *Add file → Upload files*.
- `content/site.json`: mỗi đoạn chữ có dạng `{ "en": "...", "vi": "..." }`. Trong phần chữ có thể dùng `**in đậm**` và `[link](https://...)`.
- Bài viết mới: tạo file `content/posts/ten-bai.md` có phần đầu như sau:

```
---
title: Tiêu đề bài
date: 2026-12-01
lang: vi
tags:
  - khoa học
summary: Một câu tóm tắt
---
Nội dung viết bằng Markdown...
```

- Đổi chữ trên menu (home, writing…): sửa phần `UI` ở đầu `assets/js/app.js`.

## Xem thử trên máy

Trang đọc dữ liệu từ `content/`, nên **không mở trực tiếp file html được**. Hãy chạy lệnh sau trong thư mục này:

```bash
python3 scripts/build_index.py   # cập nhật danh sách bài viết
python3 -m http.server
```

rồi mở `http://localhost:8000`.
