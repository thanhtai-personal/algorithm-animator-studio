# Tách thư mục build desktop theo hệ điều hành

Để tránh xung đột file khi build Windows và macOS, output của Electron Builder được tách theo từng nền tảng:

```text
release/
├── win/
│   ├── Kata Studio Setup 0.1.0.exe
│   ├── win-unpacked/
│   └── builder-effective-config.yaml
└── mac/
    ├── Kata Studio-0.1.0-x64.dmg
    ├── Kata Studio-0.1.0-arm64.dmg
    ├── Kata Studio-0.1.0-x64.zip
    ├── Kata Studio-0.1.0-arm64.zip
    ├── mac/
    └── builder-effective-config.yaml
```

## Build Windows

```cmd
npm run dist:win
```

Hoặc ép NSIS:

```cmd
npm run dist:win:nsis
```

Output:

```text
release/win/
```

## Build macOS

Nên chạy trên máy Mac:

```bash
npm run dist:mac
```

Build riêng Apple Silicon:

```bash
npm run dist:mac:arm64
```

Build riêng Intel Mac:

```bash
npm run dist:mac:x64
```

Output:

```text
release/mac/
```

## Build bản unpacked để test

Windows:

```cmd
npm run dist:win:unpacked
```

macOS:

```bash
npm run dist:mac:dir
```

## Xóa toàn bộ release cũ

```cmd
npm run dist:clean
```

Lệnh này xóa toàn bộ thư mục `release`. Sau đó có thể build lại sạch theo từng nền tảng.
