# NEXORA Visual Asset Notes

## Identity direction

The NEXORA app icon is an original three-route orbital gateway. Three paths
converge on a single bright node to represent multiple authorized accounts
feeding one manually selected local gateway source. The deep graphite field and
electric cyan/indigo signal are designed to remain legible in both the Windows
taskbar and the application's dark workspace.

The mark intentionally contains no text, OpenAI knot, Codex logo, or copied
brand geometry.

## Generation

The master raster was generated with the built-in image generation tool using
the following production brief:

> Create an original premium app icon for NEXORA, a multi-account AI gateway.
> Form an abstract orbital gateway from exactly three converging paths around a
> precise central node. Use an opaque deep graphite square background with
> electric cyan and indigo light. Keep the construction minimal, geometric,
> vector-like, centered, and readable at 16 px. Do not use letters, text,
> watermarks, the OpenAI knot, the Codex logo, copied brand marks, glassmorphism,
> generic AI brains, chat bubbles, or mockups.

Source: `nexora-icon-master.png`.

## Derived files

PNG variants are provided at 16, 24, 32, 48, 64, 128, 256, 512, and 1024 px.
The 1024 px asset is copied to the web and Electron PNG icon locations. The
Windows ICO is derived from the 256 px PNG.

The conversion commands use FFmpeg with Lanczos scaling:

```powershell
$sizes = 16,24,32,48,64,128,256,512,1024
foreach ($size in $sizes) {
  ffmpeg -y -i docs/brand/nexora-icon-master.png `
    -vf "scale=$size`:$size:flags=lanczos" `
    "docs/brand/nexora-icon-$size.png"
}

Copy-Item docs/brand/nexora-icon-1024.png web/public/icon.png -Force
Copy-Item docs/brand/nexora-icon-1024.png packages/electron/electron/assets/icon.png -Force
ffmpeg -y -i docs/brand/nexora-icon-256.png packages/electron/electron/assets/icon.ico
```

The 1024 px and 32 px outputs were visually checked after conversion.
