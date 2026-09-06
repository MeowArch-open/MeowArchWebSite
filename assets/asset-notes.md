# MeowArch extracted assets

These files were prepared from the supplied MeowArch reference images for the landing page.

## Recommended assets

- `meowarch-header-icon.png`: simplified square MeowArch icon used in the page header. It matches the supplied `image-1 (6).png` file.
- `brand-lockup-reference.png`: exact top-left logo area, including the raster wordmark and subtitle. Use only if the full lockup is wanted as an image.
- `hero-catgirl.png`: exact Hero illustration crop. It intentionally retains the pale blue background/decorations because the source screenshot blends the character into the page background.
- `arch-cat-mark.png`: exact lower promotional Arch/cat illustration crop, with the pale decorative background retained.
- `feature-cat-powered.png`, `feature-lightweight.png`, `feature-customizable.png`, `feature-reliable.png`: four feature icon tiles as they appear in the screenshot.
- `decor-heart.png`: transparent pink heart decoration from the Hero area.
- `favicon.ico`, `favicon-32.png`, `favicon-64.png`, `apple-touch-icon.png`: browser and mobile icon sizes derived from `meowarch-header-icon.png`.

## Notes

- Text in the navigation, Hero, feature descriptions, and news list should be rendered as HTML, not cropped from the screenshot, so it remains sharp and responsive.
- The Hero character is white on a very light background. A fully transparent, pixel-perfect cutout cannot be recovered reliably from this single flattened screenshot without damaging the hair and hoodie edges; use `hero-catgirl.png` on the same pale page background, or replace it later with an original transparent illustration.
- All filenames are lowercase and web-safe. The original source image is not required at runtime; the derived project assets are self-contained.
