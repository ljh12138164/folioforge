mod heif;

use wasm_bindgen::prelude::*;
use zvidlib_hevc_encoder::{
    encoder::{hvcc_box, length_prefixed_vcl},
    engine::encoder::{colorconv, lossy::encode_idr_residual_au},
};

/// Encode one opaque sRGB RGBA8 image. Alpha must be flattened by the caller.
#[wasm_bindgen]
pub fn encode_heic(rgba: &[u8], width: u32, height: u32, quality: u8) -> Result<Vec<u8>, String> {
    let (w, h) = (width as usize, height as usize);
    if w == 0 || h == 0 || w > 16384 || h > 16384 || w * h > 48_000_000 {
        return Err("HEIC dimensions must be 1–16384 and at most 48 million pixels".into());
    }
    if rgba.len() != w * h * 4 {
        return Err("HEIC RGBA buffer size does not match dimensions".into());
    }
    if !(1..=100).contains(&quality) {
        return Err("HEIC quality must be 1–100".into());
    }
    if rgba.chunks_exact(4).any(|pixel| pixel[3] != 255) {
        return Err("HEIC requires opaque pixels; flatten alpha first".into());
    }

    // The encoder requires 16-pixel blocks. Repeat edge pixels; clap restores the original extent.
    let (cw, ch) = (w.div_ceil(16) * 16, h.div_ceil(16) * 16);
    let mut y = vec![0; cw * ch];
    let mut cb = vec![0; cw * ch / 4];
    let mut cr = vec![0; cw * ch / 4];
    let mut rows = vec![0; cw * 4 * 2];
    for py in (0..ch).step_by(2) {
        for row in 0..2 {
            let source_y = (py + row).min(h - 1);
            let target = &mut rows[row * cw * 4..(row + 1) * cw * 4];
            target[..w * 4].copy_from_slice(&rgba[source_y * w * 4..(source_y + 1) * w * 4]);
            let edge = &rgba[(source_y * w + w - 1) * 4..(source_y * w + w) * 4];
            for pixel in target[w * 4..].chunks_exact_mut(4) {
                pixel.copy_from_slice(edge);
            }
            colorconv::luma_row(target, &mut y[(py + row) * cw..(py + row + 1) * cw]);
        }
        let start = py / 2 * (cw / 2);
        colorconv::chroma_row_pair(&rows[..cw * 4], &rows[cw * 4..],
            &mut cb[start..start + cw / 2], &mut cr[start..start + cw / 2]);
    }
    let qp = ((100 - quality as i32) * 51 + 49) / 99;
    let (annexb, _) = encode_idr_residual_au(&y, &cb, &cr, cw, ch, qp)
        .map_err(|error| format!("HEVC encoding failed: {error:?}"))?;
    let hvcc = hvcc_box(&annexb).map_err(|error| error.to_string())?;
    let data = length_prefixed_vcl(&annexb).map_err(|error| error.to_string())?;
    Ok(heif::package(&hvcc, &data, width, height, cw as u32, ch as u32))
}
