use vtracer::{ColorImage, Config, FitMode, Preset};
use wasm_bindgen::prelude::*;

/// Trace opaque RGBA8 pixels. The caller composites alpha onto its chosen background.
#[wasm_bindgen]
pub fn vectorize_svg(rgba: &[u8], width: u32, height: u32, preset: &str) -> Result<String, String> {
    let count = u64::from(width) * u64::from(height);
    if width == 0 || height == 0 || width > 16384 || height > 16384 || count > 4_000_000 {
        return Err("SVG 描摹尺寸需为 1–16384，且不超过 400 万像素，请先调整最大宽高。".into());
    }
    if rgba.len() as u64 != count * 4 {
        return Err("SVG RGBA buffer size does not match dimensions".into());
    }
    if rgba.chunks_exact(4).any(|pixel| pixel[3] != 255) {
        return Err("SVG requires opaque pixels; flatten alpha first".into());
    }
    let preset = match preset {
        "poster" => Preset::Poster,
        "bw" => Preset::Bw,
        "photo" => Preset::Photo,
        _ => return Err("无效的 SVG 描摹模式。".into()),
    };
    let mut config = Config::from_preset(preset);
    // Preserve small icons and 1px inputs; the photo preset keeps its stronger noise filter.
    if !matches!(preset, Preset::Photo) {
        config.filter_speckle = 0;
    }
    // A one-pixel-wide contour cannot form a smoothed closed curve.
    if width < 3 || height < 3 {
        config.mode = FitMode::Pixel;
        config.filter_speckle = 0;
    }
    config.optimize = 2;
    let image = ColorImage { pixels: rgba.to_vec(), width: width as usize, height: height as usize };
    let mut svg = config.build().map_err(|error| error.to_string())?
        .to_svg(&image).map_err(|error| error.to_string())?;
    // Binary tracing emits only the black foreground; keep its white background opaque too.
    if matches!(preset, Preset::Bw) {
        let root = svg.find("<svg ").ok_or("SVG root missing")?;
        let end = root + svg[root..].find('>').ok_or("SVG root incomplete")? + 1;
        svg.insert_str(end, &format!("\n<path fill=\"#ffffff\" d=\"M0 0H{width}V{height}H0Z\"/>"));
    }
    if svg.len() > 16 * 1024 * 1024 {
        return Err("SVG 路径过多，结果超过 16 MB，请缩小尺寸或改用照片描摹模式。".into());
    }
    Ok(svg)
}
