# WATS Mobile – Assets

Place the following image files here for the app icon and splash:

| File | Recommended size | Description |
|------|------------------|-------------|
| `icon.png` | 1024×1024 | App icon (used by iOS and Android) |
| `splash.png` | 1284×2778 or similar | Splash screen image |
| `adaptive-icon.png` | 1024×1024 | Android adaptive icon (foreground) |

**Colours (from design):** Primary blue `#0078D4`, white text. Splash background is set to `#0078D4` in `app.json`.

If these files are missing, `expo start` may still run in Expo Go; for production builds (EAS), add the assets or use `npx expo prebuild` to generate placeholders.
