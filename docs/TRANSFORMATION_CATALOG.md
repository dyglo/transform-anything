# Transformation catalog

Updated: 7 October 2026. All ten families remain in scope. This catalog describes processing availability; the stable task ledger is DEVELOPMENT_TRACKER.md. Tested status requires current evidence in IMPLEMENTATION_STATUS.md.

| Family            | Current operations                                                         | Remaining scope                                                             | Status                                   |
| ----------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------- |
| Screenshot Studio | Crop/resize; text, arrows, outlines, highlights, blur, opaque redaction    | Frames, padding, combining                                                  | Tested, partial                          |
| Compare           | None                                                                       | Side-by-side, overlay, slider, synchronized zoom, pixel difference          | Planned                                  |
| Image Prep        | Crop, resize, rotate, JPEG/WebP optimize, PNG/JPEG/WebP convert, Remove BG | Metadata inspection/controls, further background editing                    | Tested, partial                          |
| ShareCard         | None                                                                       | Text/image/URL to styled cards                                              | Planned                                  |
| Document Clean    | None                                                                       | PDF merge/split/reorder/extract/convert/compress/annotate/sign/redact       | Planned                                  |
| Data → Visual     | None                                                                       | CSV/JSON/tables/numbers to clean data, charts/tables/graphics               | Planned                                  |
| Mockup            | None                                                                       | Browser/device/social/presentation compositions                             | Planned                                  |
| File Transformer  | Shared PNG/JPEG/WebP conversion                                            | Document/audio/video/archive/spreadsheet/ebook conversions with real codecs | Tested shared conversion; partial        |
| Text → Visual     | None                                                                       | Quote/code/statistic/text graphics                                          | Planned                                  |
| Web Capture       | None                                                                       | Page/section/mobile/desktop screenshot and PDF                              | Planned; cloud prerequisites unavailable |

Current operations accept one PNG/JPEG/WebP and return one reusable image. Optimize accepts JPEG/WebP only. Remove BG and annotations produce PNG at original size. Canvas quality cannot guarantee smaller output. JPEG fills alpha white. Planned formats do not enter the registry until an actual executor exists.

All operations use Object → Registry → Engine → Executor → New Object → Graph. Cloud extension types and graph arrays do not prove remote or multi-input processing exists.
