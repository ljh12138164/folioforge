zvidlib-hevc-encoder 0.5.0, from https://crates.io/crates/zvidlib-hevc-encoder/0.5.0
Repository: https://github.com/lsegal/zvidlib

Upstream source and its MIT LICENSE / NOTICE.md are retained. Local changes:

- Remove the crate-wide `cfg(not(target_arch = "wasm32"))` in src/lib.rs. Hardware defaults are disabled by our Cargo dependency; the scalar encoder works without threads or host clocks.
- In encoder.rs, copy the generated SPS profile/tier/level into hvcC instead of hardcoding level 1, and describe its single temporal layer.

All remaining zvidlib dependencies are exact 0.5.0 registry packages pinned by Cargo.lock. The exported API uses only the lossy IDR encoder, color conversion and NAL packaging helpers. No native hardware encoding or decoder is included in the linked WASM output.
