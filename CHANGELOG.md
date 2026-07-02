# [1.10.0](https://github.com/paludevhouse/personal-development-program/compare/v1.9.1...v1.10.0) (2026-07-02)


### Features

* warn on import when an uploaded file yields zero rows ([c6d143b](https://github.com/paludevhouse/personal-development-program/commit/c6d143bc220e8d4750b2c0ea90346f5c2e108112))

## [1.9.1](https://github.com/paludevhouse/personal-development-program/compare/v1.9.0...v1.9.1) (2026-07-02)


### Bug Fixes

* read the "Template" sheet on import, not sheet index 0 ([c38333d](https://github.com/paludevhouse/personal-development-program/commit/c38333d6e1bc4a5303e0ee579f259732f64665ac))

# [1.9.0](https://github.com/paludevhouse/personal-development-program/compare/v1.8.2...v1.9.0) (2026-07-02)


### Features

* optimistic updates, skeleton loaders, empty-state CTAs ([f37248e](https://github.com/paludevhouse/personal-development-program/commit/f37248ef986c9130a62a9b711f75cb304eaab70e))

## [1.8.2](https://github.com/paludevhouse/personal-development-program/compare/v1.8.1...v1.8.2) (2026-07-02)


### Bug Fixes

* require a valid session before ETag/304 freshness responses ([fe9161d](https://github.com/paludevhouse/personal-development-program/commit/fe9161d25e198eab63b1f146eff28a12582a760e))


### Performance Improvements

* collection-version ETag + 304 on list endpoints + single dashboard aggregate ([310fa50](https://github.com/paludevhouse/personal-development-program/commit/310fa501794efe6a8f464541c961939603a6c510))

## [1.8.1](https://github.com/paludevhouse/personal-development-program/compare/v1.8.0...v1.8.1) (2026-07-02)


### Performance Improvements

* persist query cache to localStorage + longer staleTime on read hooks ([2fdb5d6](https://github.com/paludevhouse/personal-development-program/commit/2fdb5d6cc631d7dd10aa7713c00fcfc562574db6))

# [1.8.0](https://github.com/paludevhouse/personal-development-program/compare/v1.7.0...v1.8.0) (2026-07-02)


### Features

* stats dashboard + format supervisor name in Canva export ([00bff95](https://github.com/paludevhouse/personal-development-program/commit/00bff952028ff72eb7abbb5669855b24a3c15c6f))

# [1.7.0](https://github.com/paludevhouse/personal-development-program/compare/v1.6.0...v1.7.0) (2026-07-02)


### Features

* bounded table scroll (sticky header) on list pages + show admin email ([cb6ae41](https://github.com/paludevhouse/personal-development-program/commit/cb6ae4154e0fb3b50276219ca5b459181145819b))
* grade page mass-fill applies to table + single Kirim Semua submit (no per-row send) ([600c820](https://github.com/paludevhouse/personal-development-program/commit/600c8204b891fbc797e90d0a8dff0229ac102a5d))

# [1.6.0](https://github.com/paludevhouse/personal-development-program/compare/v1.5.0...v1.6.0) (2026-07-02)


### Features

* Canva bulk-create sheet in grade export (short name, letter grades, overall performance, pronoun) ([afad00f](https://github.com/paludevhouse/personal-development-program/commit/afad00f8980e45c3493822ca276ad0cb6fc65c5b))

# [1.5.0](https://github.com/paludevhouse/personal-development-program/compare/v1.4.0...v1.5.0) (2026-07-02)


### Features

* class promotion / year rollover flow (redesign phase C) ([e145cc3](https://github.com/paludevhouse/personal-development-program/commit/e145cc3f79c739c5a16c04fcfa80eae6ee2f1482))

# [1.4.0](https://github.com/paludevhouse/personal-development-program/compare/v1.3.0...v1.4.0) (2026-07-02)


### Features

* student status flow — Aktif/Nonaktif/Semua tabs + bulk status change (redesign phase B) ([ac5f203](https://github.com/paludevhouse/personal-development-program/commit/ac5f2038d488aeab957a360d6974367e77c21f8b))

# [1.3.0](https://github.com/paludevhouse/personal-development-program/compare/v1.2.1...v1.3.0) (2026-07-02)


### Features

* class roster view /classes/[id] — add/remove students (redesign phase A) ([d18f8f3](https://github.com/paludevhouse/personal-development-program/commit/d18f8f38e0411e8eb933483de63528ab5c70c556))

## [1.2.1](https://github.com/paludevhouse/personal-development-program/compare/v1.2.0...v1.2.1) (2026-07-02)


### Bug Fixes

* grade table shows real ratings + kategori for graded rows ([c7ff658](https://github.com/paludevhouse/personal-development-program/commit/c7ff658f8928fe2eb0cd1f2ccacdcb8b114ee7e9))

# [1.2.0](https://github.com/paludevhouse/personal-development-program/compare/v1.1.0...v1.2.0) (2026-07-01)


### Features

* class-binding UI (Kelas column, bulk-assign, per-row-class import) + Nama-NIS-Kelas labels + staleTime ([745f8bc](https://github.com/paludevhouse/personal-development-program/commit/745f8bcc2532494bf91ff850a97c87dc0299d1f0))
* denormalize current class on student + bulk-assign endpoint + N+1 read fixes ([0e4da5a](https://github.com/paludevhouse/personal-development-program/commit/0e4da5a39d75fc222e70ed344e8664d30e81565b))
* import templates with dropdown (data-validation) columns via exceljs ([598f546](https://github.com/paludevhouse/personal-development-program/commit/598f546a01137675e83e719c580ca14d87445c6b))
* student Firestore doc id = NIS + FK re-key migration script ([69d4151](https://github.com/paludevhouse/personal-development-program/commit/69d4151823fc2e750fc1c667b2dfaee0fa21aca8))

# [1.1.0](https://github.com/paludevhouse/personal-development-program/compare/v1.0.3...v1.1.0) (2026-07-01)


### Features

* grade export title (date + academic year) + NIS and Kelas columns ([8d60156](https://github.com/paludevhouse/personal-development-program/commit/8d601567d2ec3f89632664927eb4fe782fab60ef))
* mass grading on grade page (select students + shared criteria + single submit) ([44f2d81](https://github.com/paludevhouse/personal-development-program/commit/44f2d811d8c2e39c55e0cb88b3753bf22d1e3020))
* responsive grade page (desktop table w/ criteria columns, mobile cards) ([0c08f5e](https://github.com/paludevhouse/personal-development-program/commit/0c08f5ee01f0ab2f7d4597887d2052e7df8edf76))


### Performance Improvements

* long-lived Cache-Control for rarely-changing static assets ([909993f](https://github.com/paludevhouse/personal-development-program/commit/909993fff2c49686c7e6424d365b8447b35392db))

## [1.0.3](https://github.com/paludevhouse/personal-development-program/compare/v1.0.2...v1.0.3) (2026-07-01)


### Bug Fixes

* grade form draft recovery — stop re-seed effect clobbering restored draft ([68da63b](https://github.com/paludevhouse/personal-development-program/commit/68da63b0ab409120cc7c4d55223311e041d9e98a))
* larger table minWidths so wide tables scroll horizontally instead of squeezing ([e543085](https://github.com/paludevhouse/personal-development-program/commit/e543085df845769e12d37905ccc4c3f7f61bf746))

## [1.0.2](https://github.com/paludevhouse/personal-development-program/compare/v1.0.1...v1.0.2) (2026-07-01)


### Bug Fixes

* downgrade firebase-admin to v12 (jose@4 CJS) to fix ERR_REQUIRE_ESM on serverless ([d01b0df](https://github.com/paludevhouse/personal-development-program/commit/d01b0dfac0eb7480fb2031c5c8eb96b6c9c2ee26))

## [1.0.1](https://github.com/paludevhouse/personal-development-program/compare/v1.0.0...v1.0.1) (2026-07-01)


### Bug Fixes

* require Node >=22.12 so serverless supports require() of ESM (jose/jwks-rsa) ([854577e](https://github.com/paludevhouse/personal-development-program/commit/854577e1ea6e9f2937e7b5fc0e2815f9b8e71162))

# 1.0.0 (2026-07-01)


### Bug Fixes

* **ci:** use Node 22 and resync lockfile for semantic-release ([5ac4d57](https://github.com/ferdyars/personal-development-program/commit/5ac4d57d68cbfa1a5db2d47ace53bba03defd122))
* **ci:** use npm install instead of npm ci (cross-platform lockfile drift) ([85c2d13](https://github.com/ferdyars/personal-development-program/commit/85c2d133f1d923ab898b930d5b6d9645ee36eb38))
* **import:** guard enrollment against undefined student id ([b68b0cc](https://github.com/ferdyars/personal-development-program/commit/b68b0ccc6d796ea536e68e2687b67ef2e601adbc))
* stabilize build — finalize student model (full name + NIS) and type all imports ([2e4ce2b](https://github.com/ferdyars/personal-development-program/commit/2e4ce2b3d3d5f3bb4865ca76fcf240c071edbadb))


### Features

* add Firebase admin + client helpers ([18cd985](https://github.com/ferdyars/personal-development-program/commit/18cd985de1b059d09c7ff9b0267481dd4a6a6fd0))
* add MDC logo asset + wire into header/login; header label update ([b691579](https://github.com/ferdyars/personal-development-program/commit/b6915791964434e03a673d10b45dd10a882fd8f6))
* admin login with Firebase session cookie + route guard ([ea54105](https://github.com/ferdyars/personal-development-program/commit/ea541054a55e3ce891550df4782082f7f7572837))
* auto-save grade form drafts to localStorage (restore on reload, clear on submit) ([428d500](https://github.com/ferdyars/personal-development-program/commit/428d500a1bdb0b5b92ae2f74f62c2c8a714c9375))
* bold modal titles, error status codes in toasts, template label, default-active year ([42cff9e](https://github.com/ferdyars/personal-development-program/commit/42cff9ec03817c911d1708518c3f1b8d63dc1ebc))
* centralized route titles + page descriptions (routes config + PageHeader) ([18262b5](https://github.com/ferdyars/personal-development-program/commit/18262b5f140f7e700345c29310ebd00195d7c89d))
* classes CRUD (API + UI) scoped by academic year ([f5b3391](https://github.com/ferdyars/personal-development-program/commit/f5b3391d67541584e8137be0f09e324efc4dc3dd))
* counseling module (Konseling) with per-student denormalized history ([661bf83](https://github.com/ferdyars/personal-development-program/commit/661bf837fb571bd6b9a4f367b95592c0fd0ca649))
* edit existing records (academic years, classes, companies) ([f4d66ee](https://github.com/ferdyars/personal-development-program/commit/f4d66eef8b17d5a3d54db2ec5708f92a444f7051))
* enforce single active academic year (activate one deactivates others) ([7324513](https://github.com/ferdyars/personal-development-program/commit/7324513ab3745d040ba025bc448abac196f98435))
* excel import UI (dropdowns + preview) + roster export ([78c7ac0](https://github.com/ferdyars/personal-development-program/commit/78c7ac0fb8ff7000a2706fe09fe540080484a823))
* excel student import parser + create-or-update-by-NISN API ([991003f](https://github.com/ferdyars/personal-development-program/commit/991003f8b5db72b65235a2a894ad84ca1ad199f9))
* forward AbortSignal so filter/search changes cancel in-flight requests ([aebb3d2](https://github.com/ferdyars/personal-development-program/commit/aebb3d266a318865e775a1da598c3f6d7de69921))
* global error notifications for failed queries and mutations ([388c800](https://github.com/ferdyars/personal-development-program/commit/388c800b81e47b5acb6fcebb2fbfe3a171ead4a9))
* grade confirmation modal + lock + per-student and group completion validation ([54d816d](https://github.com/ferdyars/personal-development-program/commit/54d816d04597f7278fec02d2d96c6b117788467d))
* idempotency keys on create routes to prevent duplicate records ([c6f11f4](https://github.com/ferdyars/personal-development-program/commit/c6f11f494b690d3c149ac4c2e008878ebe70e0eb))
* illustrated 404/500 pages + empty & error states on data lists ([42cf15c](https://github.com/ferdyars/personal-development-program/commit/42cf15c9edfedca8bddacd936c0361f9366fa488))
* Indonesian date/time formatting (dayjs id locale) + counseling captures time ([2de1d4a](https://github.com/ferdyars/personal-development-program/commit/2de1d4a00eaa8ce693a9a9b9122eccd198ae9d6b))
* internship grade computation module ([78d4fe8](https://github.com/ferdyars/personal-development-program/commit/78d4fe8949eff1103068d3e2037c5c0a131ece98))
* internships admin UI + public PIC grading form ([db8d2f1](https://github.com/ferdyars/personal-development-program/commit/db8d2f11ef595b2281ea54302544bf3a7d0e43ca))
* internships API (placement + token) + public grading endpoint ([57b7cd8](https://github.com/ferdyars/personal-development-program/commit/57b7cd851e18a2a3cfac98cacc92bc854b6d97a1))
* invalidate related TanStack queries after mutations (import refreshes students + selects) ([abc8cfd](https://github.com/ferdyars/personal-development-program/commit/abc8cfd70dcbcf6c6df7278987f70cde531a5bea))
* link Master Magang to internships (autofill + phone) + WhatsApp grading link + internship edit ([b3cd193](https://github.com/ferdyars/personal-development-program/commit/b3cd19306ebfbc2f25be63b6976f2346cc3cf38d))
* loading states on list pages and settings ([48636d4](https://github.com/ferdyars/personal-development-program/commit/48636d429ee3aff2e903df24a55bfa45d697d713))
* logout button + change password (Akun) page ([0341d62](https://github.com/ferdyars/personal-development-program/commit/0341d62649a4ace5eca119c77fabb85d03ddfc80))
* magang report (stats) + internship grade Excel export ([f3e3ea2](https://github.com/ferdyars/personal-development-program/commit/f3e3ea281c1286723e069fec9185b5dcae674be5))
* Master Magang company master + WhatsApp link + Excel export ([4f0d2f1](https://github.com/ferdyars/personal-development-program/commit/4f0d2f1d64d7e3fd0b2351faf78750decc420f45))
* MDC brand theme (teal/orange) + logo in header and login ([654992c](https://github.com/ferdyars/personal-development-program/commit/654992ca46808623ec30cafc3ec825d5a0661cac))
* mobile-friendly nav (burger) + horizontal table scroll + Palu Dev House credit ([1a47b0a](https://github.com/ferdyars/personal-development-program/commit/1a47b0a2501bb6aeff6fc9bb7af9e5b03e7603d2))
* Phosphor icons for nav, dashboard, and action buttons ([a06c79c](https://github.com/ferdyars/personal-development-program/commit/a06c79c37f56920daec4ca743e2778ba569a9ff7))
* PIC fills placement details (lokasi/posisi/pembimbing) with grade via token ([ff59d89](https://github.com/ferdyars/personal-development-program/commit/ff59d89263d9040796d4967cf8d028923a1076da))
* PIC grading form captures full internship record (student name, phone, tanggal) ([b5f1e09](https://github.com/ferdyars/personal-development-program/commit/b5f1e09bace2c9dbe9d6b8fdcc0cd4b137756ce4))
* PIC token grades all interns at the same company+PIC (group grading) + fix invalid-date crash ([d132726](https://github.com/ferdyars/personal-development-program/commit/d13272602ca40dfda4dacd4c507cd1c102c367ce))
* reusable create-form modal (FormModal) across CRUD pages ([e415d9c](https://github.com/ferdyars/personal-development-program/commit/e415d9cbe6ffca8f7244c27e91a46f1b612cec72))
* scaffold Next 14 Pages Router + Mantine + TanStack Query + Vitest ([99795d5](https://github.com/ferdyars/personal-development-program/commit/99795d5acfff8700c74ae192498e4fbd74e43ff4))
* shared API method router + ApiError + Firestore repo ([a9a4a4f](https://github.com/ferdyars/personal-development-program/commit/a9a4a4f32191d489e315e5202a1f09ef6a8d64f1))
* shared types + academic years CRUD (API + UI) ([2429133](https://github.com/ferdyars/personal-development-program/commit/2429133b6c84ea86bfb4db41cb1c4e50385b2725))
* show only active academic years in selection dropdowns ([85084f0](https://github.com/ferdyars/personal-development-program/commit/85084f021f56603e44cecbbe2af4297799d9f33e))
* status-filter tabs + URL-persisted filters with auto-apply ([30f3fc9](https://github.com/ferdyars/personal-development-program/commit/30f3fc9aad7603dbb96bbaa4b8889239e357a38e))
* student detail page with unified class/magang/konseling/wawancara history ([ef2dde0](https://github.com/ferdyars/personal-development-program/commit/ef2dde0083f2853d5356da45b1c3a2c10c5e7c65))
* student status (aktif/lulus/pindah) with filter and inline change ([3a2299d](https://github.com/ferdyars/personal-development-program/commit/3a2299dea119b0a3976b2124349bc4dd00e149c7))
* students API + list page with explicit Search ([bb675f7](https://github.com/ferdyars/personal-development-program/commit/bb675f7cf8f9e73422292cc68b4ae54dccce8369))
* UI redesign — elevation, brand theme, Plus Jakarta Sans, dashboard, active nav ([26fce58](https://github.com/ferdyars/personal-development-program/commit/26fce5825bc302ecc35c146e61163dd15b890b23))
* **ux:** semester Select + preselect active academic year ([797e1d0](https://github.com/ferdyars/personal-development-program/commit/797e1d0cbf2c2cfc65f13405d46a5b70da6dbdae))
* Wawancara Penjurusan module (major-selection interview) with per-student history ([dc41be3](https://github.com/ferdyars/personal-development-program/commit/dc41be3860c59818d3e61b8ddfceed698da498f7))
* WhatsApp message template manager (settings) + templated WA link ([2176ac8](https://github.com/ferdyars/personal-development-program/commit/2176ac8341b66cc8373c427173f07ef941b42101))
* Zod validation for create forms (schemas + server 400 + mantine-form) ([20716e5](https://github.com/ferdyars/personal-development-program/commit/20716e5c598c802c8937ef8552a788df7ba18b83))


### Performance Improvements

* TanStack cache defaults (staleTime, no focus refetch) + no-store on API responses ([cbeb080](https://github.com/ferdyars/personal-development-program/commit/cbeb080bf4a3ee1e9a95a768ea7acd86342dd272))
